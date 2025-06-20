
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart,
  Target,
  Clock,
  Award,
  Brain,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AnimationWrapper } from '@/components/AnimationWrapper';

const Analytics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    completedSessions: 0,
    activeTargets: 0,
    averageRating: 0,
    improvementRate: 0,
    weeklyProgress: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        setUser(session.user);
        loadAnalytics(session.user.id);
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  const loadAnalytics = async (userId: string) => {
    try {
      // Load sessions data
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          targets!inner(user_id)
        `)
        .eq('targets.user_id', userId);

      // Load targets data
      const { data: targets } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', userId);

      // Load feedback data
      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId);

      const completedSessions = sessions?.filter(s => s.status === 'complete') || [];
      const totalRatings = feedback?.reduce((sum, f) => sum + (f.rating || 0), 0) || 0;
      const avgRating = feedback?.length ? totalRatings / feedback.length : 0;

      setAnalytics({
        totalSessions: sessions?.length || 0,
        completedSessions: completedSessions.length,
        activeTargets: targets?.length || 0,
        averageRating: Math.round(avgRating * 10) / 10,
        improvementRate: Math.min(95, completedSessions.length * 12 + avgRating * 8),
        weeklyProgress: Math.min(100, completedSessions.length * 8 + (targets?.length || 0) * 15)
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-slate-400 font-medium">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <AnimationWrapper type="fade-in" delay={0}>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">
                Coaching Analytics
              </h1>
            </div>
            <p className="text-slate-400">
              Track your coaching journey and relationship growth patterns
            </p>
          </div>
        </AnimationWrapper>

        {/* Key Metrics */}
        <AnimationWrapper type="slide-up" delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="coaching-card border-purple-500/30">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-slate-200 mb-1">{analytics.totalSessions}</div>
                <div className="text-sm text-slate-400">Total Sessions</div>
              </CardContent>
            </Card>

            <Card className="coaching-card border-indigo-500/30">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-slate-200 mb-1">{analytics.completedSessions}</div>
                <div className="text-sm text-slate-400">Completed Analysis</div>
              </CardContent>
            </Card>

            <Card className="coaching-card border-cyan-500/30">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-slate-200 mb-1">{analytics.activeTargets}</div>
                <div className="text-sm text-slate-400">Active Relationships</div>
              </CardContent>
            </Card>
          </div>
        </AnimationWrapper>

        {/* Progress Tracking */}
        <AnimationWrapper type="slide-up" delay={200}>
          <Card className="coaching-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-200">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                Your Growth Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">Coaching Mastery</span>
                  <span className="text-sm text-purple-400">{analytics.improvementRate}%</span>
                </div>
                <Progress value={analytics.improvementRate} className="h-3 bg-slate-800" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">Weekly Progress</span>
                  <span className="text-sm text-indigo-400">{analytics.weeklyProgress}%</span>
                </div>
                <Progress value={analytics.weeklyProgress} className="h-3 bg-slate-800" />
              </div>

              {analytics.averageRating > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-300">Satisfaction Rating</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-yellow-400">{analytics.averageRating}</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                  <Progress value={analytics.averageRating * 20} className="h-3 bg-slate-800" />
                </div>
              )}
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Detailed Analytics Tabs */}
        <AnimationWrapper type="slide-up" delay={300}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
                Insights
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
                Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="coaching-card">
                <CardHeader>
                  <CardTitle className="text-slate-200">Session Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Completion Rate</span>
                        <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                          {analytics.totalSessions > 0 ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100) : 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Active Relationships</span>
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                          {analytics.activeTargets}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Average Quality</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Heart 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < Math.round(analytics.averageRating) 
                                  ? 'text-red-400 fill-current' 
                                  : 'text-slate-600'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <Card className="coaching-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-200">
                    <Brain className="w-5 h-5 mr-2 text-purple-400" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse-soft" />
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Advanced Insights Coming Soon</h3>
                    <p className="text-slate-400">
                      Complete more coaching sessions to unlock personalized relationship patterns and strategic recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card className="coaching-card">
                <CardHeader>
                  <CardTitle className="text-slate-200">Growth Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-float" />
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Trend Analysis</h3>
                    <p className="text-slate-400">
                      Historical data and trend analysis will appear here as you continue your coaching journey.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AnimationWrapper>
      </div>
    </div>
  );
};

export default Analytics;
