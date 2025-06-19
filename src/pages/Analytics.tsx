
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { BarChart3, TrendingUp, Clock, Target, MessageSquare, Calendar } from 'lucide-react';

interface Analytics {
  total_sessions: number;
  completed_sessions: number;
  total_targets: number;
  avg_session_duration: string;
}

const Analytics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

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
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Analytics</h1>
          <p className="mt-2 text-gray-600">
            Detailed insights into your coaching sessions and performance
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics?.total_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                All coaching conversations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.completed_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.total_sessions ? 
                  Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion percentage
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics?.avg_session_duration || '0 min'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Active Targets</p>
                      <p className="text-sm text-gray-500">People being coached</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics?.total_targets || 0}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Sessions per Target</p>
                      <p className="text-sm text-gray-500">Average interactions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.total_targets && analytics?.total_sessions ? 
                      Math.round(analytics.total_sessions / analytics.total_targets) : 0}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Improvement Rate</p>
                      <p className="text-sm text-gray-500">Based on completions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics?.total_sessions ? 
                      Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.total_sessions === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      No sessions yet. Start coaching to see insights here!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-medium text-blue-900 mb-1">Great Progress!</h4>
                      <p className="text-sm text-blue-700">
                        You've completed {analytics?.completed_sessions || 0} sessions with a {
                          analytics?.total_sessions ? 
                            Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0
                        }% success rate.
                      </p>
                    </div>

                    {analytics && analytics.total_sessions > 0 && analytics.completed_sessions / analytics.total_sessions < 0.7 && (
                      <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                        <h4 className="font-medium text-amber-900 mb-1">Room for Improvement</h4>
                        <p className="text-sm text-amber-700">
                          Consider following up more consistently to improve completion rates.
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-medium text-green-900 mb-1">Next Steps</h4>
                      <p className="text-sm text-green-700">
                        {analytics?.total_targets === 0 
                          ? "Create your first target to start coaching."
                          : `Focus on engaging with your ${analytics?.total_targets} targets more regularly.`
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
