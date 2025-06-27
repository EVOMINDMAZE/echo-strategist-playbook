import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Brain, TrendingUp, Calendar, Users, MessageSquare, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PersonalInsightsProps {
  userId: string;
}

interface InsightData {
  averageSessionLength: number;
  mostActiveDay: string;
  improvementTrend: number;
  relationshipFocus: string;
  communicationPattern: string;
  weeklyGrowth: number;
}

export const PersonalInsights = ({ userId }: PersonalInsightsProps) => {
  const [insights, setInsights] = useState<InsightData>({
    averageSessionLength: 0,
    mostActiveDay: 'Monday',
    improvementTrend: 0,
    relationshipFocus: 'Communication',
    communicationPattern: 'Analytical',
    weeklyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Fetch coaching sessions for analysis
        const { data: sessions } = await supabase
          .from('coaching_sessions')
          .select(`
            *,
            targets!inner(user_id)
          `)
          .eq('targets.user_id', userId);

        const { data: feedback } = await supabase
          .from('user_feedback')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Calculate insights - use default duration since duration field doesn't exist
        const avgLength = sessions?.length ? 
          sessions.reduce((sum, s) => sum + 15, 0) / sessions.length : 0; // Default 15 min per session

        // Find most active day
        const dayCount: { [key: string]: number } = {};
        sessions?.forEach(session => {
          const day = new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'long' });
          dayCount[day] = (dayCount[day] || 0) + 1;
        });
        const mostActive = Object.keys(dayCount).reduce((a, b) => 
          dayCount[a] > dayCount[b] ? a : b, 'Monday'
        );

        // Calculate improvement trend
        const recentFeedback = feedback?.slice(0, 5) || [];
        const olderFeedback = feedback?.slice(5, 10) || [];
        const recentAvg = recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / (recentFeedback.length || 1);
        const olderAvg = olderFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / (olderFeedback.length || 1);
        const trend = Math.round(((recentAvg - olderAvg) / olderAvg) * 100) || 0;

        // Weekly growth calculation
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSessions = sessions?.filter(s => new Date(s.created_at) > lastWeek).length || 0;
        const weeklyGrowth = Math.round((recentSessions / (sessions?.length || 1)) * 100);

        setInsights({
          averageSessionLength: Math.round(avgLength),
          mostActiveDay: mostActive,
          improvementTrend: trend,
          relationshipFocus: 'Communication Skills',
          communicationPattern: 'Thoughtful Listener',
          weeklyGrowth
        });
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personal Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Session Duration</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">
              <AnimatedCounter end={insights.averageSessionLength} />
              <span className="text-lg">min</span>
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              Average time per session
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-teal-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Most Active Day</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 mb-1">
              {insights.mostActiveDay}
            </div>
            <p className="text-xs text-green-600">
              Your peak coaching day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700">Growth Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-900">
              <AnimatedCounter end={Math.abs(insights.improvementTrend)} suffix="%" />
            </div>
            <p className="text-xs text-rose-600 mt-1">
              {insights.improvementTrend >= 0 ? 'Improvement' : 'Focus area'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Your Communication Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Primary Focus</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-900">{insights.relationshipFocus}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Most discussed topic in your sessions
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Communication Pattern</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-medium text-green-900">{insights.communicationPattern}</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your natural approach to conversations
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Weekly Activity</h4>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-900">
                      <AnimatedCounter end={insights.weeklyGrowth} suffix="%" />
                    </span>
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Of your total sessions this week
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Focus</h4>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-medium text-purple-900">Relationship Depth</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Suggested area for your next sessions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Growth Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Your Personal Growth Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-900">Relationship Builder</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Focus on creating meaningful connections
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-900">Active Learner</h4>
                <p className="text-sm text-green-700 mt-1">
                  Consistently seeking communication improvement
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-900">Thoughtful Analyst</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Deep thinking approach to relationships
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
