import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { TargetSelection } from '@/components/TargetSelection';

const Targets = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { clients, loading, createClient } = useSupabaseCoaching();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };

    getUser();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Clients</h1>
          <p className="mt-2 text-gray-600">
            Manage the people you're coaching and start new conversations.
          </p>
        </div>

        <TargetSelection
          clients={clients}
          onCreate={createClient}
          onClientSelect={(client) => {
            // Navigate to clients page to start a session
            navigate('/clients');
          }}
          onStartChat={(client) => {
            // Navigate to clients page to start a session
            navigate('/clients');
          }}
        />
      </div>
    </div>
  );
};

export default Targets;
