
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { EnhancedNavigation } from '@/components/EnhancedNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntelligentOnboarding } from '@/components/IntelligentOnboarding';
import { SecretRoomTheme } from '@/components/SecretRoomTheme';
import { ChatViewHeader } from '@/components/ChatViewHeader';
import { ChatInputArea } from '@/components/ChatInputArea';
import { ChatMessages } from '@/components/ChatMessages';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import { ResultsView } from '@/components/ResultsView';
import { InformativeMessages } from '@/components/InformativeMessages';
import { useChatMessageHandler } from '@/components/ChatMessageHandler';
import { ChatOnboardingHandler } from '@/components/ChatOnboardingHandler';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { SessionStatus } from '@/types/coaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRef } from 'react';
import { toast } from 'sonner';

const Chat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { getSession, updateSession } = useSupabaseCoaching();
  const { hasContext, loading: contextLoading } = useIntelligentOnboarding(sessionId || '');

  // Auth effect - runs once
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (!authSession) {
          console.log('No auth session, redirecting to auth');
          navigate('/auth');
          return;
        }
        setUser(authSession.user);
        console.log('User authenticated:', authSession.user.id);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setError('Authentication failed');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Session loading effect - runs when sessionId and user change
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      if (!sessionId || !user) {
        console.log('Missing sessionId or user:', { sessionId, userId: user?.id });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Loading session:', sessionId);
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('Session loading timed out');
            setError('Session loading timed out');
            setLoading(false);
          }
        }, 10000);

        const sessionData = await getSession(sessionId);
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.log('Session data loaded successfully:', sessionData);
        setSession(sessionData);
        
        // Get client name from URL params or fetch from target
        const clientName = searchParams.get('target');
        if (clientName) {
          setClient({
            id: sessionData.target_id,
            name: decodeURIComponent(clientName),
            created_at: new Date().toISOString()
          });
          console.log('Client set from URL params:', clientName);
        } else {
          // Fetch target information if not in URL
          const { data: targetData, error } = await supabase
            .from('targets')
            .select('*')
            .eq('id', sessionData.target_id)
            .single();
          
          if (targetData && !error && mounted) {
            setClient({
              id: targetData.id,
              name: targetData.target_name,
              created_at: targetData.created_at
            });
            console.log('Client set from database:', targetData.target_name);
          } else {
            console.error('Failed to load target data:', error);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) {
          setError('Failed to load session');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, user, getSession, searchParams]);

  // Check if we should show onboarding
  useEffect(() => {
    if (!contextLoading && hasContext === false && session && session.messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [contextLoading, hasContext, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSessionUpdate = async (updatedSession: SessionData) => {
    setSession(updatedSession);
    try {
      await updateSession(updatedSession.id, updatedSession);
      console.log('Session updated successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleStatusChange = (status: SessionStatus) => {
    if (session) {
      const updatedSession = { ...session, status };
      setSession(updatedSession);
    }
  };

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleDismissMessage = (messageType: string) => {
    setDismissedMessages(prev => [...prev, messageType]);
  };

  const handleStrategistTrigger = async () => {
    if (!session || !client) return;
    
    setIsGeneratingStrategy(true);
    handleStatusChange('analyzing');

    try {
      const response = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: session.id,
          targetName: client.name,
          chatHistory: session.messages
        }
      });

      if (response.error) throw response.error;

      const updatedSession = {
        ...session,
        status: 'complete' as SessionStatus,
        strategist_output: response.data.strategist_output
      };

      handleSessionUpdate(updatedSession);
      handleStatusChange('complete');
      toast.success('Analysis complete! Check out your personalized strategies.');
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Failed to generate strategy. Please try again.');
      handleStatusChange('gathering_info');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const { handleSendMessage } = useChatMessageHandler({
    session: session!,
    client: client!,
    onSessionUpdate: handleSessionUpdate
  });

  if (loading || contextLoading) {
    return (
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-slate-300 font-medium">Preparing your secure coaching session...</p>
          </div>
        </div>
      </SecretRoomTheme>
    );
  }

  if (error || !session || !client) {
    return (
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-200">
              {error || 'Session not found'}
            </h3>
            <p className="text-slate-400">
              We couldn't load your coaching session. Please try again.
            </p>
            <button 
              onClick={() => navigate('/clients')} 
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Clients
            </button>
          </div>
        </div>
      </SecretRoomTheme>
    );
  }

  if (showOnboarding) {
    return (
      <IntelligentOnboarding
        sessionId={sessionId!}
        targetName={client.name}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  if (session.status === 'complete' && session.strategist_output) {
    return (
      <ResultsView
        session={session}
        client={client}
        onBackToClients={() => navigate('/clients')}
        onNewSession={() => {
          const newSession = {
            ...session,
            status: 'gathering_info' as SessionStatus,
            messages: [],
            strategist_output: undefined
          };
          handleSessionUpdate(newSession);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <ChatViewHeader
            session={session}
            target={client}
            previousSessions={previousSessions}
            messages={session.messages}
            isGeneratingStrategy={isGeneratingStrategy}
            onBackToTargets={() => navigate('/clients')}
            onStrategistTrigger={handleStrategistTrigger}
          />

          <div className="flex-1 overflow-hidden">
            <div className="h-full max-w-4xl mx-auto">
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                  <SessionHistoryLoader
                    targetId={session.target_id}
                    currentSessionId={session.id}
                    onHistoryLoaded={setPreviousSessions}
                  />

                  {session.messages.length === 0 && previousSessions.length > 0 && (
                    <SessionContinuityHandler
                      previousSessions={previousSessions}
                      onFollowUpSelect={handleSendMessage}
                    />
                  )}

                  {session.messages.length === 0 && previousSessions.length === 0 && (
                    <InformativeMessages 
                      messageCount={session.messages.length}
                      onDismiss={handleDismissMessage}
                      dismissedMessages={dismissedMessages}
                    />
                  )}

                  <ChatMessages
                    sessionId={session.id}
                    targetId={session.target_id}
                    messages={session.messages}
                    isLoading={isGeneratingStrategy}
                    onSuggestionClick={handleSendMessage}
                    onStrategistTrigger={handleStrategistTrigger}
                    sessionStatus={session.status}
                  />

                  <div ref={messagesEndRef} />
                </div>

                <ChatInputArea
                  session={session}
                  previousSessions={previousSessions}
                  messages={session.messages}
                  isLoading={isGeneratingStrategy}
                  onSubmit={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </div>
      </SecretRoomTheme>
    </ErrorBoundary>
  );
};

export default Chat;
