
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { DashboardStats } from '@/components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Users, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalChats: 0,
    activeClients: 0,
    thisWeekSessions: 0,
    avgSessionTime: '0 min'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      loadDashboardData(session.user.id);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          loadDashboardData(session.user.id);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDashboardData = async (userId: string) => {
    try {
      // Load recent coaching sessions
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          targets (
            target_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessions) {
        setRecentActivity(sessions);
      }

      // Load quick stats
      const { data: targets } = await supabase
        .from('targets')
        .select('id')
        .eq('user_id', userId);

      const { data: allSessions } = await supabase
        .from('coaching_sessions')
        .select('id, status, created_at');

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const thisWeekSessions = allSessions?.filter(s => 
        new Date(s.created_at) > thisWeekStart
      ).length || 0;

      setQuickStats({
        totalChats: allSessions?.length || 0,
        activeClients: targets?.length || 0,
        thisWeekSessions,
        avgSessionTime: '25 min'
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <WorldClassNavigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Coach'}! 👋
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Ready to make today's coaching sessions impactful?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Chats</p>
                  <p className="text-3xl font-bold text-blue-900">{quickStats.totalChats}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Clients</p>
                  <p className="text-3xl font-bold text-green-900">{quickStats.activeClients}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold text-purple-900">{quickStats.thisWeekSessions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Avg Session</p>
                  <p className="text-3xl font-bold text-orange-900">{quickStats.avgSessionTime}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Sparkles className="w-6 h-6 mr-2" />
                Start New Coaching Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-4">
                Begin a new AI-powered coaching conversation with your clients
              </p>
              <Button 
                onClick={() => navigate('/clients')}
                className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold"
              >
                Go to Chats <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 3).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">
                            {session.targets?.target_name || 'Session'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.status === 'complete' ? 'default' : 'secondary'}>
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

        <DashboardStats userId={user.id} />
      </div>
    </div>
  );
};

export default Dashboard;
