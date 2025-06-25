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
  Shield
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
      <div className="min-h-screen warm-gradient">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-warm-pulse rounded-full h-12 w-12 bg-teal-600 mx-auto flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="warm-text font-medium">Loading your insights...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen warm-gradient">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <AnimationWrapper type="fade-in" delay={0}>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg shadow-soft">
                <BarChart3 className="w-6 h-6 text-teal-700 dark:text-teal-300" />
              </div>
              <h1 className="text-3xl font-serif font-bold warm-text">
                Your Growth Journey
              </h1>
            </div>
            <p className="warm-text-muted">
              Thoughtful insights into your coaching progress and relationship patterns
            </p>
          </div>
        </AnimationWrapper>

        {/* Key Metrics with Organic Layout */}
        <AnimationWrapper type="fade-in" delay={100}>
          <div className="organic-grid mb-8">
            <Card className="warm-card border-teal-200 dark:border-teal-700/30 text-center warm-hover">
              <CardContent className="p-6">
                <MessageSquare className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-3 animate-gentle-pulse" />
                <div className="text-3xl font-serif font-bold warm-text mb-1">{analytics.totalSessions}</div>
                <div className="text-sm warm-text-muted">Meaningful Conversations</div>
              </CardContent>
            </Card>

            <Card className="warm-card border-sage-200 dark:border-sage-700/30 text-center warm-hover">
              <CardContent className="p-6">
                <Target className="w-8 h-8 text-sage-600 dark:text-sage-400 mx-auto mb-3 animate-gentle-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="text-3xl font-serif font-bold warm-text mb-1">{analytics.completedSessions}</div>
                <div className="text-sm warm-text-muted">Strategic Insights</div>
              </CardContent>
            </Card>

            <Card className="warm-card border-terracotta-200 dark:border-terracotta-700/30 text-center warm-hover">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-terracotta-600 dark:text-terracotta-400 mx-auto mb-3 animate-gentle-pulse" style={{ animationDelay: '1s' }} />
                <div className="text-3xl font-serif font-bold warm-text mb-1">{analytics.activeTargets}</div>
                <div className="text-sm warm-text-muted">Active Relationships</div>
              </CardContent>
            </Card>
          </div>
        </AnimationWrapper>

        {/* Progress Tracking */}
        <AnimationWrapper type="fade-in" delay={200}>
          <Card className="warm-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center warm-text font-serif">
                <TrendingUp className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                Your Personal Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium warm-text">Coaching Journey</span>
                  <span className="text-sm warm-text-accent">{analytics.improvementRate}%</span>
                </div>
                <Progress 
                  value={analytics.improvementRate} 
                  className="h-3 bg-sage-100 dark:bg-charcoal-700"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium warm-text">Weekly Progress</span>
                  <span className="text-sm warm-text-accent">{analytics.weeklyProgress}%</span>
                </div>
                <Progress 
                  value={analytics.weeklyProgress} 
                  className="h-3 bg-sage-100 dark:bg-charcoal-700"
                />
              </div>

              {analytics.averageRating > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium warm-text">Experience Quality</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-terracotta-600 dark:text-terracotta-400">{analytics.averageRating}</span>
                      <Award className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
                    </div>
                  </div>
                  <Progress 
                    value={analytics.averageRating * 20} 
                    className="h-3 bg-sage-100 dark:bg-charcoal-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Detailed Analytics Tabs */}
        <AnimationWrapper type="fade-in" delay={300}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-charcoal-800 shadow-soft border border-sage-200 dark:border-charcoal-600">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                Insights
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                Patterns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="warm-card">
                <CardHeader>
                  <CardTitle className="warm-text font-serif">Session Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="organic-grid">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="warm-text-muted">Completion Rate</span>
                        <Badge className="status-success">
                          {analytics.totalSessions > 0 ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100) : 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="warm-text-muted">Active Relationships</span>
                        <Badge className="status-info">
                          {analytics.activeTargets}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="warm-text-muted">Experience Quality</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Heart 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < Math.round(analytics.averageRating) 
                                  ? 'text-terracotta-500 fill-current' 
                                  : 'text-sage-300 dark:text-charcoal-600'
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
              <Card className="warm-card">
                <CardHeader>
                  <CardTitle className="flex items-center warm-text font-serif">
                    <Brain className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                    Thoughtful Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 text-teal-600 dark:text-teal-400 mx-auto mb-4 animate-organic-float" />
                    <h3 className="text-lg font-serif font-semibold warm-text mb-2">Deeper Insights Emerging</h3>
                    <p className="warm-text-muted">
                      Continue your coaching journey to unlock personalized relationship patterns and gentle guidance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card className="warm-card">
                <CardHeader>
                  <CardTitle className="warm-text font-serif">Growth Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-16 h-16 text-sage-600 dark:text-sage-400 mx-auto mb-4 animate-organic-float" />
                    <h3 className="text-lg font-serif font-semibold warm-text mb-2">Your Unique Journey</h3>
                    <p className="warm-text-muted">
                      Relationship patterns and growth trends will emerge as you continue exploring together.
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
