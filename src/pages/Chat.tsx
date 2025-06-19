
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { ChatView } from '@/components/ChatView';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
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
        console.log('Loading session:', sessionId);
        const sessionData = await getSession(sessionId);
        console.log('Session data loaded:', sessionData);
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
          
          if (targetData && !error) {
            setClient({
              id: targetData.id,
              name: targetData.target_name,
              created_at: targetData.created_at
            });
          }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <WorldClassNavigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your coaching session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <WorldClassNavigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xl text-gray-700 mb-4">Session not found</p>
            <button 
              onClick={() => navigate('/clients')} 
              className="text-blue-600 hover:underline font-medium"
            >
              Return to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <WorldClassNavigation user={user} />
      <ChatView
        session={session}
        target={client}
        onSessionUpdate={handleSessionUpdate}
        onStatusChange={handleStatusChange}
        onBackToTargets={() => navigate('/clients')}
      />
    </div>
  );
};

export default Chat;
