
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { ChatView } from '@/components/ChatView';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { SessionData, Target } from './Index';

const Chat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);

  const { getSession } = useSupabaseCoaching();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        navigate('/auth');
        return;
      }
      setUser(authSession.user);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const sessionData = await getSession(sessionId);
        setSession(sessionData);
        
        // Get target name from URL params
        const targetName = searchParams.get('target');
        if (targetName) {
          setTarget({
            id: sessionData.target_id,
            name: decodeURIComponent(targetName),
            created_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading session:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSession();
    }
  }, [sessionId, user, getSession, navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading session...</div>
        </div>
      </div>
    );
  }

  if (!session || !target) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>Session not found</p>
            <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <ChatView
        session={session}
        target={target}
        onSessionUpdate={setSession}
        onStatusChange={() => {}}
        onBackToTargets={() => navigate('/targets')}
      />
    </div>
  );
};

export default Chat;
