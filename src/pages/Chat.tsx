
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedNavigation } from '@/components/EnhancedNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntelligentOnboarding } from '@/components/IntelligentOnboarding';
import { SecretRoomTheme } from '@/components/SecretRoomTheme';
import ChatView from '@/components/ChatView';
import { ResultsView } from '@/components/ResultsView';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { SessionStatus } from '@/types/coaching';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

const Chat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Core states
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Chat states
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { updateSession, getSession } = useSupabaseCoaching();
  const { hasContext, loading: contextLoading } = useIntelligentOnboarding(sessionId || '');

  // Simplified authentication check with timeout
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Auth session error:', sessionError);
          if (mounted) {
            setError('Authentication failed');
            setLoading(false);
          }
          return;
        }

        if (!authSession) {
          console.log('No auth session, redirecting to auth');
          navigate('/auth');
          return;
        }

        if (mounted) {
          setUser(authSession.user);
          console.log('User authenticated:', authSession.user.id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setError('Authentication failed');
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Authentication check timeout');
        setError('Authentication timeout - please refresh the page');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate, loading]);

  // Simplified session loading with timeout
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      if (!sessionId || !user) {
        console.log('Missing sessionId or user:', { sessionId: !!sessionId, user: !!user });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Loading session:', sessionId);

        // Set timeout for session loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('Session loading timeout');
            setError('Session loading timeout - please try again');
            setLoading(false);
          }
        }, 15000); // 15 second timeout

        // Verify session access
        const { data: sessionCheck, error: sessionCheckError } = await supabase
          .from('coaching_sessions')
          .select(`
            id,
            target_id,
            targets!inner(user_id, target_name)
          `)
          .eq('id', sessionId)
          .eq('targets.user_id', user.id)
          .single();

        if (sessionCheckError || !sessionCheck) {
          console.error('Session access check failed:', sessionCheckError);
          if (mounted) {
            setError('Session not found or access denied');
            setLoading(false);
          }
          return;
        }

        // Load full session data
        const sessionData = await getSession(sessionId);
        if (!mounted) return;

        console.log('Session data loaded:', sessionData);

        // Get client info
        const clientName = searchParams.get('target');
        const client: Client = {
          id: sessionData.target_id,
          name: clientName ? decodeURIComponent(clientName) : sessionCheck.targets.target_name,
          created_at: new Date().toISOString()
        };

        // Load previous sessions for context
        const { data: prevSessions } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('target_id', sessionData.target_id)
          .neq('id', sessionId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (mounted) {
          setSession(sessionData);
          setClient(client);
          if (prevSessions) {
            setPreviousSessions(prevSessions.map(s => ({
              ...s,
              messages: Array.isArray(s.raw_chat_history) ? s.raw_chat_history : [],
              case_data: s.case_file_data || {}
            })));
          }
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) {
          setError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, user, getSession, searchParams, loading]);

  // Check if we should show onboarding
  useEffect(() => {
    if (!contextLoading && hasContext === false && session && session.messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [contextLoading, hasContext, session]);

  // Auto-scroll to bottom
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

  const handleStrategistTrigger = () => {
    setIsGeneratingStrategy(true);
  };

  const handleDismissMessage = (messageType: string) => {
    setDismissedMessages(prev => [...prev, messageType]);
  };

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Show loading while auth or context is loading
  if (loading || contextLoading) {
    return (
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-slate-300 font-medium">
              {contextLoading ? 'Loading context...' : 'Preparing your secure coaching session...'}
            </p>
            <p className="text-slate-400 text-sm">
              If this takes too long, please refresh the page
            </p>
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
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={() => navigate('/clients')} 
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Return to Clients
              </button>
            </div>
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
        <ChatView
          session={session}
          client={client}
          onSessionUpdate={handleSessionUpdate}
          messagesEndRef={messagesEndRef}
          isGeneratingStrategy={isGeneratingStrategy}
          previousSessions={previousSessions}
          dismissedMessages={dismissedMessages}
          handleStrategistTrigger={handleStrategistTrigger}
          handleDismissMessage={handleDismissMessage}
          setPreviousSessions={setPreviousSessions}
        />
      </SecretRoomTheme>
    </ErrorBoundary>
  );
};

export default Chat;
