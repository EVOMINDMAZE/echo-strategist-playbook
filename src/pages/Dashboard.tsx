
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Target, Plus, BarChart3, MessageSquare, Clock, TrendingUp } from 'lucide-react';

interface Analytics {
  total_sessions: number;
  completed_sessions: number;
  total_targets: number;
  avg_session_duration: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
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

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_session_analytics', {
          user_id_param: user.id
        });
        
        if (error) throw error;
        if (data && data.length > 0) {
          const analyticsData = data[0];
          setAnalytics({
            total_sessions: analyticsData.total_sessions,
            completed_sessions: analyticsData.completed_sessions,
            total_targets: analyticsData.total_targets,
            avg_session_duration: analyticsData.avg_session_duration ? String(analyticsData.avg_session_duration) : '0 minutes'
          });
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your coaching activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{targets.length}</div>
              <p className="text-xs text-muted-foreground">
                People you're coaching
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.total_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Coaching conversations
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analytics?.completed_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Finished sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics?.total_sessions ? 
                  Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/targets')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
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
              <Button 
                onClick={() => navigate('/analytics')}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} />
                View Session Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {targets.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">
                    No activity yet. Create your first target to get started!
                  </p>
                  <Button onClick={() => navigate('/targets')}>
                    <Plus size={16} className="mr-2" />
                    Create First Target
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {targets.slice(0, 3).map((target) => (
                    <div key={target.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{target.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(target.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate('/targets')}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {targets.length > 3 && (
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/targets')}
                      className="w-full"
                    >
                      View all {targets.length} targets
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

export default Dashboard;
