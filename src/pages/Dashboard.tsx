import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { DashboardStats } from '@/components/DashboardStats';
import { MobileOptimizedStats } from '@/components/MobileOptimizedStats';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { IntelligentSuggestions } from '@/components/IntelligentSuggestions';
import { SessionContinuity } from '@/components/SessionContinuity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Users, TrendingUp, Clock, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalChats: 0,
    activeClients: 0,
    thisWeekSessions: 0,
    avgSessionTime: '0 min',
    completionRate: 0
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

      const completedSessions = allSessions?.filter(s => s.status === 'complete').length || 0;
      const totalSessions = allSessions?.length || 0;

      setQuickStats({
        totalChats: totalSessions,
        activeClients: targets?.length || 0,
        thisWeekSessions,
        avgSessionTime: '25 min',
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
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
      
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Coach'}! 👋
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-gray-600">
            Ready to make today's coaching sessions impactful?
          </p>
        </div>

        {/* Mobile Optimized Quick Stats */}
        <div className="mb-6 sm:mb-8">
          <MobileOptimizedStats stats={quickStats} />
        </div>

        {/* Advanced Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Continue Previous Sessions */}
          <SessionContinuity userId={user.id} />
          
          {/* Intelligent Suggestions */}
          <IntelligentSuggestions userId={user.id} />
        </div>

        {/* Quick Actions & Smart Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate('/clients')}
                  className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold flex-1"
                >
                  Go to Chats <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate('/analytics')}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-indigo-600"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          <SmartSuggestions 
            userStats={{
              totalChats: quickStats.totalChats,
              completionRate: quickStats.completionRate,
              activeClients: quickStats.activeClients,
              recentActivity
            }}
          />
        </div>

        {/* Recent Activity */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                    <Badge variant={session.status === 'complete' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/analytics')}
                  className="w-full mt-4"
                >
                  View All Activity
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No recent activity. Start your first coaching session!
                </p>
                <Button onClick={() => navigate('/clients')}>
                  Start First Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Stats Component */}
        <DashboardStats userId={user.id} />
      </div>
    </div>
  );
};

export default Dashboard;
