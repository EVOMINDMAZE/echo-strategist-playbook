
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Target, Plus, BarChart3, MessageSquare } from 'lucide-react';

export type SessionStatus = 'gathering_info' | 'analyzing' | 'complete' | 'error';

export interface Target {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date | string;
  options?: string[];
}

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  case_data: Record<string, any>;
  strategist_output?: {
    analysis?: string;
    suggestions?: Array<{
      title: string;
      description: string;
      why_it_works: string;
    }>;
  };
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { targets, loading } = useSupabaseCoaching();

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

  if (loading || !user) {
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
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your coaching activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targets.length}</div>
              <p className="text-xs text-muted-foreground">
                People you're coaching
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Ongoing conversations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Playbooks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Strategies generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/targets')}
                className="w-full flex items-center justify-center gap-2"
              >
                <Target size={16} />
                Manage Targets
              </Button>
              <Button 
                onClick={() => navigate('/targets')}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add New Target
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {targets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No activity yet. Create your first target to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {targets.slice(0, 3).map((target) => (
                    <div key={target.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{target.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(target.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {targets.length > 3 && (
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/targets')}
                      className="w-full"
                    >
                      View all targets
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
