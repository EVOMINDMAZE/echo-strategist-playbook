
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { ChatView } from '@/components/ChatView';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
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

  const { getSession, updateSession } = useSupabaseCoaching();

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
        
        // Get client name from URL params
        const clientName = searchParams.get('target');
        if (clientName) {
          setClient({
            id: sessionData.target_id,
            name: decodeURIComponent(clientName),
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

  const handleSessionUpdate = async (updatedSession: SessionData) => {
    setSession(updatedSession);
    // Save to database
    try {
      await updateSession(updatedSession.id, updatedSession);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

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

  if (!session || !client) {
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
        target={client}
        onSessionUpdate={handleSessionUpdate}
        onStatusChange={() => {}}
        onBackToTargets={() => navigate('/clients')}
      />
    </div>
  );
};

export default Chat;
