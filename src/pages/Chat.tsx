
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { sanitizeChatHistory, validateStrategistOutput } from '@/utils/messageUtils';
import { toast } from 'sonner';

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
  const [needsFeedback, setNeedsFeedback] = useState(false);
  
  // Chat states - Fixed loading state management
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { updateSession, getSession } = useSupabaseCoaching();
  const { hasContext, loading: contextLoading } = useIntelligentOnboarding(sessionId || '');

  // Streamlined authentication and session loading
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current session quickly
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

        if (!sessionId) {
          console.log('No session ID provided');
          if (mounted) {
            setError('Session ID is required');
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(authSession.user);
        }

        // Load session data
        console.log('=== FRONTEND: Loading session:', sessionId);
        const sessionData = await getSession(sessionId);
        
        if (!mounted) return;

        console.log('=== FRONTEND: Raw session data from database:');
        console.log('- ID:', sessionData.id);
        console.log('- Status:', sessionData.status);
        console.log('- Messages count:', sessionData.messages.length);
        console.log('- Raw strategist_output from DB:', sessionData.strategist_output);
        console.log('- Strategist output type:', typeof sessionData.strategist_output);
        console.log('- Strategist output keys:', sessionData.strategist_output ? Object.keys(sessionData.strategist_output) : 'null/undefined');

        // Clean and validate messages
        const cleanedMessages = sanitizeChatHistory(sessionData.messages);
        console.log('Cleaned messages:', cleanedMessages.length, 'from', sessionData.messages.length);

        // Get client info
        const clientName = searchParams.get('target');
        const client: Client = {
          id: sessionData.target_id,
          name: clientName ? decodeURIComponent(clientName) : 'Client',
          created_at: new Date().toISOString()
        };

        // Load previous sessions for context (reduced for performance)
        const { data: prevSessions } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('target_id', sessionData.target_id)
          .neq('id', sessionId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (mounted) {
          const finalSessionData = {
            ...sessionData,
            messages: cleanedMessages
          };

          console.log('=== FRONTEND: Setting final session state:');
          console.log('- Status:', finalSessionData.status);
          console.log('- Strategist output:', finalSessionData.strategist_output);
          console.log('- Should show ResultsView?:', finalSessionData.status === 'complete' && !!finalSessionData.strategist_output);

          setSession(finalSessionData);
          setClient(client);
          
          if (prevSessions) {
            const formattedSessions: SessionData[] = prevSessions.map(s => ({
              id: s.id,
              target_id: s.target_id,
              status: s.status as SessionStatus,
              messages: sanitizeChatHistory(s.raw_chat_history),
              strategist_output: validateStrategistOutput(s.strategist_output),
              case_file_data: (s.case_file_data && typeof s.case_file_data === 'object' && !Array.isArray(s.case_file_data)) ? s.case_file_data as Record<string, any> : {},
              feedback_data: (s.feedback_data && typeof s.feedback_data === 'object' && !Array.isArray(s.feedback_data)) ? s.feedback_data as Record<string, any> : {},
              user_feedback: s.user_feedback,
              parent_session_id: s.parent_session_id,
              is_continued: s.is_continued || false,
              feedback_submitted_at: s.feedback_submitted_at,
              feedback_rating: s.feedback_rating,
              created_at: s.created_at,
              case_data: (s.case_file_data && typeof s.case_file_data === 'object' && !Array.isArray(s.case_file_data)) ? s.case_file_data as Record<string, any> : {}
            }));
            setPreviousSessions(formattedSessions);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        if (mounted) {
          setError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
        }
      }
    };

    initializeSession();

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
      subscription.unsubscribe();
    };
  }, [sessionId, navigate, getSession, searchParams]);

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
    console.log('=== FRONTEND: handleSessionUpdate called');
    console.log('- Updated session status:', updatedSession.status);
    console.log('- Updated strategist output:', updatedSession.strategist_output);
    console.log('- Messages count:', updatedSession.messages.length);
    
    setSession(updatedSession);
    
    // Reset loading state when session is updated
    if (updatedSession.status === 'complete' && updatedSession.strategist_output) {
      setIsGeneratingStrategy(false);
    }
    
    try {
      await updateSession(updatedSession.id, updatedSession);
      console.log('Session updated successfully in database');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleStrategistTrigger = async () => {
    console.log('=== FRONTEND: handleStrategistTrigger called ===');
    console.log('Session ID:', sessionId);
    console.log('Session object:', session);
    console.log('Client object:', client);
    
    if (!session || !client || !sessionId) {
      console.error('Missing required data for strategist trigger:', {
        hasSession: !!session,
        hasClient: !!client,
        hasSessionId: !!sessionId
      });
      toast.error('Missing session data. Please refresh the page.');
      return;
    }

    console.log('Messages count:', session.messages?.length || 0);
    console.log('Target name:', client.name);
    
    setIsGeneratingStrategy(true);
    
    try {
      console.log('=== FRONTEND: About to invoke trigger-strategist ===');
      console.log('Payload will be:', {
        sessionId: sessionId,
        targetName: client.name,
        chatHistory: session.messages
      });

      const response = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: sessionId,
          targetName: client.name,
          chatHistory: session.messages
        }
      });

      console.log('=== FRONTEND: trigger-strategist response received ===');
      console.log('Response:', response);
      
      if (response.error) {
        console.error('Edge function returned error:', response.error);
        throw new Error(response.error.details || response.error.message || 'Analysis failed');
      }

      console.log('=== FRONTEND: Analysis successful, reloading session ===');
      
      // Reload the session to get the updated strategist output
      const updatedSessionData = await getSession(sessionId);
      console.log('=== FRONTEND: Updated session data after reload:');
      console.log('- Updated session status:', updatedSessionData.status);
      console.log('- Updated strategist output exists:', !!updatedSessionData.strategist_output);
      console.log('- Updated strategist output content:', updatedSessionData.strategist_output);
      console.log('- Will trigger ResultsView?:', updatedSessionData.status === 'complete' && !!updatedSessionData.strategist_output);
      
      setSession(updatedSessionData);
      setIsGeneratingStrategy(false); // Explicitly reset loading state
      toast.success('Strategic analysis complete!');
      
    } catch (error) {
      console.error('=== FRONTEND: Error in handleStrategistTrigger ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset the generating state on error
      setIsGeneratingStrategy(false);
    }
  };

  const handleContinueSession = async () => {
    console.log('=== FRONTEND: handleContinueSession called ===');
    if (!session) return;
    
    // Check if feedback is required before continuing
    if (session.status === 'complete' && !session.feedback_submitted_at) {
      console.log('=== FRONTEND: Feedback required before continuing ===');
      setNeedsFeedback(true);
      return;
    }
    
    // Reset session status to allow re-analysis and continue chatting
    const continuedSession = {
      ...session,
      status: 'gathering_info' as SessionStatus,
      // Keep messages and strategist_output for context
    };
    
    console.log('=== FRONTEND: Continuing session with status reset ===');
    setIsGeneratingStrategy(false); // Ensure loading state is reset
    await handleSessionUpdate(continuedSession);
  };

  const handleFeedbackComplete = () => {
    setNeedsFeedback(false);
    // Now continue the session after feedback is complete
    if (session) {
      const continuedSession = {
        ...session,
        status: 'gathering_info' as SessionStatus,
      };
      handleSessionUpdate(continuedSession);
    }
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

  // Show loading with better messaging
  if (loading || contextLoading) {
    return (
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-slate-300 font-medium">
              {contextLoading ? 'Loading conversation context...' : 'Loading your coaching session...'}
            </p>
            <p className="text-slate-400 text-sm">
              This should only take a few seconds
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

  console.log('=== FRONTEND: About to render, checking conditions:');
  console.log('- Session status:', session?.status);
  console.log('- Has strategist output:', !!session?.strategist_output);
  console.log('- Should show ResultsView:', session?.status === 'complete' && !!session?.strategist_output);
  console.log('- Needs feedback:', needsFeedback);

  // Show feedback modal if needed
  if (needsFeedback && session && client) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Feedback Required</h3>
          <p className="text-gray-600 mb-6">
            Please provide feedback on your previous analysis before continuing the chat.
          </p>
          <div className="flex space-x-3">
            <Button 
              onClick={handleFeedbackComplete}
              className="flex-1"
            >
              Provide Feedback
            </Button>
            <Button 
              variant="outline"
              onClick={() => setNeedsFeedback(false)}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (session?.status === 'complete' && session?.strategist_output && !needsFeedback) {
    console.log('=== FRONTEND: Rendering ResultsView with session:', {
      id: session.id,
      status: session.status,
      strategist_output: session.strategist_output
    });

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
          setIsGeneratingStrategy(false);
          handleSessionUpdate(newSession);
        }}
        onContinueSession={handleContinueSession}
      />
    );
  }

  console.log('=== FRONTEND: Rendering ChatView (analysis not complete or no output)');

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden">
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
      </div>
    </ErrorBoundary>
  );
};

export default Chat;
