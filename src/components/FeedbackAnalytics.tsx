
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Star, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackAnalytics as FeedbackAnalyticsType } from '@/types/coaching';

interface FeedbackAnalyticsProps {
  targetId?: string;
}

interface SuggestionEffectiveness {
  [key: string]: {
    tried_count: number;
    success_rate: number;
  };
}

export const FeedbackAnalytics = ({ targetId }: FeedbackAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from('user_feedback')
          .select(`
            *,
            coaching_sessions (
              strategist_output
            )
          `)
          .eq('user_id', user.id);

        if (targetId) {
          query = query.eq('target_id', targetId);
        }

        const { data: feedbacks, error } = await query;

        if (error) throw error;

        if (feedbacks && feedbacks.length > 0) {
          // Calculate analytics
          const totalFeedbacks = feedbacks.length;
          const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks;
          
          // Track suggestion effectiveness
          const suggestionEffectiveness: SuggestionEffectiveness = {};
          
          feedbacks.forEach(feedback => {
            if (feedback.suggestions_tried) {
              feedback.suggestions_tried.forEach(suggestion => {
                if (!suggestionEffectiveness[suggestion]) {
                  suggestionEffectiveness[suggestion] = { tried_count: 0, success_rate: 0 };
                }
                suggestionEffectiveness[suggestion].tried_count += 1;
                if (feedback.outcome_rating && feedback.outcome_rating >= 4) {
                  suggestionEffectiveness[suggestion].success_rate += 1;
                }
              });
            }
          });

          // Calculate success rates
          Object.keys(suggestionEffectiveness).forEach(key => {
            const data = suggestionEffectiveness[key];
            data.success_rate = data.tried_count > 0 ? (data.success_rate / data.tried_count) * 100 : 0;
          });

          // Extract common themes
          const whatWorks = feedbacks
            .filter(f => f.what_worked_well)
            .map(f => f.what_worked_well!)
            .join(' ')
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 4)
            .slice(0, 5);

          const whatDoesnt = feedbacks
            .filter(f => f.what_didnt_work)
            .map(f => f.what_didnt_work!)
            .join(' ')
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 4)
            .slice(0, 5);

          setAnalytics({
            average_rating: averageRating,
            total_feedbacks: totalFeedbacks,
            suggestions_effectiveness: suggestionEffectiveness,
            common_themes: {
              what_works: whatWorks,
              what_doesnt: whatDoesnt
            }
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [targetId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 bg-gray-200 rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.total_feedbacks === 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">No Analytics Yet</h3>
          <p className="text-blue-600">Complete some coaching sessions to see your feedback analytics!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Average Rating</p>
                <p className="text-3xl font-bold text-green-800">
                  {analytics?.average_rating.toFixed(1)}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-800">{analytics?.total_feedbacks}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Strategies Tried</p>
                <p className="text-3xl font-bold text-purple-800">
                  {Object.keys(analytics?.suggestions_effectiveness || {}).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Effectiveness */}
      {analytics && Object.keys(analytics.suggestions_effectiveness).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Strategy Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.suggestions_effectiveness)
              .sort(([,a], [,b]) => b.success_rate - a.success_rate)
              .slice(0, 5)
              .map(([strategy, data]) => (
                <div key={strategy} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 truncate max-w-xs">
                      {strategy}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {data.tried_count} tries
                      </Badge>
                      <span className="text-sm font-medium text-slate-600">
                        {data.success_rate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={data.success_rate} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Common Themes */}
      {analytics && (analytics.common_themes.what_works.length > 0 || analytics.common_themes.what_doesnt.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.common_themes.what_works.length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">What's Working</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.common_themes.what_works.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.common_themes.what_doesnt.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.common_themes.what_doesnt.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
