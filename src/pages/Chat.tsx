
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import ChatView from '@/components/ChatView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntelligentOnboarding } from '@/components/IntelligentOnboarding';
import { SecretRoomTheme } from '@/components/SecretRoomTheme';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { SessionStatus } from '@/types/coaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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

  const { getSession, updateSession } = useSupabaseCoaching();
  const { hasContext, loading: contextLoading } =useIntelligentOnboarding(sessionId || '');

  // Auth effect - runs once
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (!authSession) {
          navigate('/auth');
          return;
        }
        setUser(authSession.user);
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
      if (!sessionId || !user) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Loading session:', sessionId);
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            setError('Session loading timed out');
            setLoading(false);
          }
        }, 10000);

        const sessionData = await getSession(sessionId);
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.log('Session data loaded successfully');
        setSession(sessionData);
        
        // Get client name from URL params or fetch from target
        const clientName = searchParams.get('target');
        if (clientName) {
          setClient({
            id: sessionData.target_id,
            name: decodeURIComponent(clientName),
            created_at: new Date().toISOString()
          });
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
  }, [sessionId, user]);

  // Check if we should show onboarding
  useEffect(() => {
    if (!contextLoading && hasContext === false && session && session.messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [contextLoading, hasContext, session]);

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

  if (loading || contextLoading) {
    return (
      <SecretRoomTheme>
        <WorldClassNavigation user={user} />
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
        <WorldClassNavigation user={user} />
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

  return (
    <ErrorBoundary>
      <SecretRoomTheme>
        <WorldClassNavigation user={user} />
        <ChatView
          session={session}
          target={client}
          onSessionUpdate={handleSessionUpdate}
          onStatusChange={handleStatusChange}
          onBackToTargets={() => navigate('/clients')}
        />
      </SecretRoomTheme>
    </ErrorBoundary>
  );
};

export default Chat;
