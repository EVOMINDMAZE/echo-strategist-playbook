
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  MessageSquare,
  Clock,
  Star,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  totalChats: number;
  completedChats: number;
  totalTargets: number;
  avgSessionTime: string;
  weeklyProgress: number;
  completionRate: number;
  recentActivity: any[];
  topPerformingTargets: any[];
}

const Analytics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalChats: 0,
    completedChats: 0,
    totalTargets: 0,
    avgSessionTime: '0 min',
    weeklyProgress: 0,
    completionRate: 0,
    recentActivity: [],
    topPerformingTargets: []
  });
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
      loadAnalyticsData(session.user.id);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          loadAnalyticsData(session.user.id);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAnalyticsData = async (userId: string) => {
    try {
      // Load coaching sessions
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          targets (
            id,
            target_name
          )
        `)
        .order('created_at', { ascending: false });

      // Load targets
      const { data: targets } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', userId);

      if (sessions && targets) {
        const completedSessions = sessions.filter(s => s.status === 'complete');
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);
        
        const thisWeekSessions = sessions.filter(s => 
          new Date(s.created_at) > thisWeekStart
        );

        // Calculate top performing targets
        const targetPerformance = targets.map(target => {
          const targetSessions = sessions.filter(s => s.targets?.id === target.id);
          const completedTargetSessions = targetSessions.filter(s => s.status === 'complete');
          
          return {
            ...target,
            totalSessions: targetSessions.length,
            completedSessions: completedTargetSessions.length,
            completionRate: targetSessions.length > 0 ? 
              Math.round((completedTargetSessions.length / targetSessions.length) * 100) : 0
          };
        }).sort((a, b) => b.completionRate - a.completionRate);

        setAnalytics({
          totalChats: sessions.length,
          completedChats: completedSessions.length,
          totalTargets: targets.length,
          avgSessionTime: '25 min', // Mock data
          weeklyProgress: thisWeekSessions.length,
          completionRate: sessions.length > 0 ? 
            Math.round((completedSessions.length / sessions.length) * 100) : 0,
          recentActivity: sessions.slice(0, 10),
          topPerformingTargets: targetPerformance.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <WorldClassNavigation user={user} />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <WorldClassNavigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics Dashboard 📊
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Track your coaching progress and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Chats</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.totalChats}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.weeklyProgress} this week</span>
                  </div>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.completionRate}%</p>
                  <div className="flex items-center mt-1">
                    <Target className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{analytics.completedChats} completed</span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Targets</p>
                  <p className="text-3xl font-bold text-purple-900">{analytics.totalTargets}</p>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">coaching relationships</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Avg Session</p>
                  <p className="text-3xl font-bold text-orange-900">{analytics.avgSessionTime}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">per conversation</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Targets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Top Performing Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topPerformingTargets.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPerformingTargets.map((target: any) => (
                    <div key={target.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{target.target_name}</h4>
                        <p className="text-xs text-gray-500">
                          {target.completedSessions}/{target.totalSessions} sessions completed
                        </p>
                      </div>
                      <Badge 
                        variant={target.completionRate >= 80 ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {target.completionRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No targets yet. Start your first coaching session!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentActivity.slice(0, 5).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          session.status === 'complete' ? 'bg-green-500' : 
                          session.status === 'analyzing' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-sm">
                            {session.targets?.target_name || 'Session'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={session.status === 'complete' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent activity. Start your first coaching session!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Take Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate('/clients')}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Start New Chat
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-indigo-600"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
