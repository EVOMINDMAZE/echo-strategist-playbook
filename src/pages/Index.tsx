import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { MessageSquare } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { clients, loading } = useSupabaseCoaching();

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Relationship Coaching
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized strategies and insights to improve your relationships, 
            communication, and social interactions.
          </p>
        </div>

        {user ? (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Your Coaching Journey</CardTitle>
                <p className="text-gray-600">
                  Continue working with your existing clients or add new ones.
                </p>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Start Your First Coaching Session
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Add a client to begin receiving personalized coaching strategies 
                      and communication insights.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => navigate('/clients')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add Your First Client
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Your Clients</h3>
                      <Button onClick={() => navigate('/clients')}>
                        Manage Clients
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {clients.slice(0, 3).map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <h4 className="font-medium">{client.name}</h4>
                            <p className="text-sm text-gray-500">
                              Added {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => navigate('/clients')}>
                            View Sessions
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600 mb-8 text-center">
              Ready to transform your relationships? Sign up to start your personalized coaching journey.
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
