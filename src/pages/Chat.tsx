
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedNavigation } from '@/components/EnhancedNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntelligentOnboarding } from '@/components/IntelligentOnboarding';
import { SecretRoomTheme } from '@/components/SecretRoomTheme';
import ChatView from '@/components/ChatView';
import { ResultsView } from '@/components/ResultsView';
import { ChatAuthHandler } from '@/components/ChatAuthHandler';
import { ChatSessionLoader } from '@/components/ChatSessionLoader';
import { ChatStateManager } from '@/components/ChatStateManager';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { SessionStatus } from '@/types/coaching';
import { User } from '@supabase/supabase-js';

const Chat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { updateSession } = useSupabaseCoaching();
  const { hasContext, loading: contextLoading } = useIntelligentOnboarding(sessionId || '');

  // Check if we should show onboarding
  useEffect(() => {
    if (!contextLoading && hasContext === false && session && session.messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [contextLoading, hasContext, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSessionLoad = (loadedSession: SessionData, loadedClient: Client) => {
    console.log('Session loaded in Chat component:', loadedSession.id);
    setSession(loadedSession);
    setClient(loadedClient);
    setLoading(false);
  };

  const handleAuthLoad = (loadedUser: User | null) => {
    console.log('User loaded in Chat component:', loadedUser?.id);
    setUser(loadedUser);
    setAuthLoading(false);
  };

  const handleAuthError = (authError: string) => {
    console.error('Auth error in Chat component:', authError);
    setError(authError);
    setAuthLoading(false);
    
    // Redirect to auth page after a short delay
    setTimeout(() => {
      navigate('/auth');
    }, 2000);
  };

  const handleSessionError = (sessionError: string) => {
    console.error('Session error in Chat component:', sessionError);
    setError(sessionError);
    setLoading(false);
  };

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

  // Show loading while auth or context is loading
  if (authLoading || (loading && !error) || contextLoading) {
    return (
      <SecretRoomTheme>
        <EnhancedNavigation user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-slate-300 font-medium">
              {authLoading ? 'Authenticating...' : contextLoading ? 'Loading context...' : 'Preparing your secure coaching session...'}
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
              {error === 'Authentication required' 
                ? 'Please sign in to access your coaching session.' 
                : 'We couldn\'t load your coaching session. Please try again.'}
            </p>
            <div className="flex gap-4 justify-center">
              {error === 'Authentication required' ? (
                <button 
                  onClick={() => navigate('/auth')} 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Sign In
                </button>
              ) : (
                <>
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
                </>
              )}
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
        
        <ChatAuthHandler 
          onUserLoad={handleAuthLoad}
          onError={handleAuthError}
        />
        
        <ChatSessionLoader
          sessionId={sessionId}
          user={user}
          onSessionLoad={handleSessionLoad}
          onError={handleSessionError}
          onLoading={setLoading}
        />

        <ChatStateManager
          session={session}
          client={client}
          onSessionUpdate={handleSessionUpdate}
          onStatusChange={handleStatusChange}
        >
          {(stateProps) => (
            <ChatView
              session={session}
              client={client}
              onSessionUpdate={handleSessionUpdate}
              messagesEndRef={messagesEndRef}
              {...stateProps}
            />
          )}
        </ChatStateManager>
      </SecretRoomTheme>
    </ErrorBoundary>
  );
};

export default Chat;
