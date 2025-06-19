
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackInsight {
  type: 'strength' | 'improvement' | 'trend';
  title: string;
  description: string;
  metric?: number;
  icon: React.ReactNode;
  color: string;
}

interface FeedbackInsightsProps {
  targetId: string;
}

export const FeedbackInsights = ({ targetId }: FeedbackInsightsProps) => {
  const [insights, setInsights] = useState<FeedbackInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateInsights = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: feedbacks, error } = await supabase
          .from('user_feedback')
          .select('*')
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (feedbacks && feedbacks.length >= 2) {
          const generatedInsights: FeedbackInsight[] = [];

          // Rating trend analysis
          const recentRatings = feedbacks.slice(-3).map(f => f.rating);
          const avgRecent = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
          const olderRatings = feedbacks.slice(0, -3).map(f => f.rating);
          const avgOlder = olderRatings.length > 0 ? olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length : avgRecent;

          if (avgRecent > avgOlder + 0.5) {
            generatedInsights.push({
              type: 'trend',
              title: 'Improving Satisfaction',
              description: 'Your coaching sessions are getting more helpful over time!',
              metric: ((avgRecent - avgOlder) / avgOlder * 100),
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'bg-green-50 border-green-200 text-green-800'
            });
          }

          // Strategy effectiveness
          const allSuggestionsTried = feedbacks
            .filter(f => f.suggestions_tried && f.suggestions_tried.length > 0)
            .map(f => f.suggestions_tried!.length)
            .reduce((a, b) => a + b, 0);

          const successfulOutcomes = feedbacks
            .filter(f => f.outcome_rating && f.outcome_rating >= 4).length;

          if (allSuggestionsTried > 0 && successfulOutcomes / feedbacks.length > 0.6) {
            generatedInsights.push({
              type: 'strength',
              title: 'Great Strategy Implementation',
              description: 'You consistently try the suggested strategies and see positive results.',
              metric: Math.round((successfulOutcomes / feedbacks.length) * 100),
              icon: <CheckCircle className="w-5 h-5" />,
              color: 'bg-blue-50 border-blue-200 text-blue-800'
            });
          }

          // Identify improvement areas
          const lowRatings = feedbacks.filter(f => f.rating <= 2).length;
          if (lowRatings > 0 && lowRatings / feedbacks.length > 0.3) {
            generatedInsights.push({
              type: 'improvement',
              title: 'Opportunity for Better Alignment',
              description: 'Some sessions might benefit from more specific context about your situation.',
              metric: Math.round((lowRatings / feedbacks.length) * 100),
              icon: <AlertCircle className="w-5 h-5" />,
              color: 'bg-orange-50 border-orange-200 text-orange-800'
            });
          }

          // Consistency insight
          const hasDetailedFeedback = feedbacks.filter(f => 
            f.what_worked_well || f.what_didnt_work || f.additional_notes
          ).length;

          if (hasDetailedFeedback / feedbacks.length > 0.7) {
            generatedInsights.push({
              type: 'strength',
              title: 'Detailed Feedback Provider',
              description: 'Your detailed feedback helps improve the coaching experience for everyone.',
              metric: Math.round((hasDetailedFeedback / feedbacks.length) * 100),
              icon: <Target className="w-5 h-5" />,
              color: 'bg-purple-50 border-purple-200 text-purple-800'
            });
          }

          setInsights(generatedInsights);
        }
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [targetId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Building Insights</h3>
          <p className="text-gray-500">Complete a few more sessions to see personalized insights!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-slate-800">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
          Personal Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${insight.color} animate-fade-in`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {insight.icon}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  {insight.metric !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{insight.metric}%</span>
                      </div>
                      <Progress value={insight.metric} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="ml-2 text-xs capitalize"
              >
                {insight.type}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
