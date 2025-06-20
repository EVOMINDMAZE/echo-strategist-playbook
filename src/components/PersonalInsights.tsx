
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Target, 
  Brain,
  Star,
  Calendar,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SessionData } from '@/types/coaching';
import { sanitizeChatHistory, validateStrategistOutput } from '@/utils/messageUtils';

interface PersonalInsightsProps {
  userId: string;
  targetId?: string;
}

interface UserAnalytics {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalTargets: number;
  recentTrends: {
    mostDiscussedTopics: string[];
    emotionalTrends: string[];
    successfulStrategies: string[];
  };
  learningProgress: {
    communicationSkills: number;
    relationshipInsights: number;
    strategyApplication: number;
  };
}

export const PersonalInsights = ({ userId, targetId }: PersonalInsightsProps) => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    loadPersonalInsights();
  }, [userId, targetId]);

  const loadPersonalInsights = async () => {
    try {
      setLoading(true);

      // Get user's coaching sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          targets!inner(user_id, target_name)
        `)
        .eq('targets.user_id', userId)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get user feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId);

      if (feedbackError) throw feedbackError;

      // Process analytics
      const completedSessions = sessions?.filter(s => s.status === 'complete') || [];
      const totalRatings = feedback?.reduce((sum, f) => sum + (f.rating || 0), 0) || 0;
      const avgRating = feedback?.length ? totalRatings / feedback.length : 0;

      // Extract trends from strategist outputs
      const allSuggestions: string[] = [];
      const emotionalThemes: string[] = [];
      
      completedSessions.forEach(session => {
        const strategistOutput = validateStrategistOutput(session.strategist_output);
        if (strategistOutput?.suggestions) {
          strategistOutput.suggestions.forEach((suggestion) => {
            if (suggestion.title) allSuggestions.push(suggestion.title);
          });
        }
        if (strategistOutput?.analysis) {
          // Simple keyword extraction for emotional themes
          const analysis = strategistOutput.analysis.toLowerCase();
          if (analysis.includes('stress') || analysis.includes('tension')) emotionalThemes.push('Stress Management');
          if (analysis.includes('trust') || analysis.includes('connection')) emotionalThemes.push('Building Trust');
          if (analysis.includes('communication') || analysis.includes('listening')) emotionalThemes.push('Communication');
          if (analysis.includes('conflict') || analysis.includes('disagreement')) emotionalThemes.push('Conflict Resolution');
        }
      });

      // Get unique targets count
      const uniqueTargets = new Set(sessions?.map(s => s.target_id) || []).size;

      // Calculate learning progress based on feedback and session completion
      const communicationSkills = Math.min(95, (completedSessions.length * 15) + (avgRating * 10));
      const relationshipInsights = Math.min(90, (uniqueTargets * 20) + (completedSessions.length * 8));
      const strategyApplication = Math.min(85, (feedback?.length || 0) * 25 + avgRating * 5);

      const analyticsData: UserAnalytics = {
        totalSessions: sessions?.length || 0,
        completedSessions: completedSessions.length,
        averageRating: Math.round(avgRating * 10) / 10,
        totalTargets: uniqueTargets,
        recentTrends: {
          mostDiscussedTopics: [...new Set(allSuggestions)].slice(0, 5),
          emotionalTrends: [...new Set(emotionalThemes)].slice(0, 4),
          successfulStrategies: feedback?.filter(f => f.outcome_rating && f.outcome_rating >= 4)
            .flatMap(f => f.suggestions_tried || [])
            .slice(0, 3) || []
        },
        learningProgress: {
          communicationSkills,
          relationshipInsights,
          strategyApplication
        }
      };

      setAnalytics(analyticsData);
      
      // Map sessions to SessionData format
      const mappedSessions: SessionData[] = completedSessions.slice(0, 3).map(session => ({
        id: session.id,
        target_id: session.target_id,
        status: session.status as SessionData['status'],
        messages: sanitizeChatHistory(session.raw_chat_history),
        strategist_output: validateStrategistOutput(session.strategist_output),
        case_file_data: session.case_file_data as Record<string, any> || {},
        feedback_data: session.feedback_data as Record<string, any> || {},
        user_feedback: session.user_feedback,
        parent_session_id: session.parent_session_id,
        is_continued: session.is_continued || false,
        feedback_submitted_at: session.feedback_submitted_at,
        feedback_rating: session.feedback_rating,
        created_at: session.created_at,
        case_data: session.case_file_data as Record<string, any> || {}
      }));
      
      setRecentSessions(mappedSessions);

    } catch (error) {
      console.error('Error loading personal insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Insights Yet</h3>
        <p className="text-gray-500">Complete a few coaching sessions to see your personal insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Your Coaching Journey
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover patterns, track progress, and celebrate your growth in building meaningful relationships
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-900">{analytics.totalSessions}</div>
            <div className="text-sm text-blue-700">Total Sessions</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-900">{analytics.completedSessions}</div>
            <div className="text-sm text-green-700">Completed Analysis</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-yellow-900">{analytics.averageRating || 'N/A'}</div>
            <div className="text-sm text-yellow-700">Avg Rating</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-900">{analytics.totalTargets}</div>
            <div className="text-sm text-purple-700">Relationships</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-800">
            <TrendingUp className="w-5 h-5 mr-2" />
            Your Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Communication Skills</span>
              <span className="text-sm text-gray-600">{analytics.learningProgress.communicationSkills}%</span>
            </div>
            <Progress value={analytics.learningProgress.communicationSkills} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Relationship Insights</span>
              <span className="text-sm text-gray-600">{analytics.learningProgress.relationshipInsights}%</span>
            </div>
            <Progress value={analytics.learningProgress.relationshipInsights} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Strategy Application</span>
              <span className="text-sm text-gray-600">{analytics.learningProgress.strategyApplication}%</span>
            </div>
            <Progress value={analytics.learningProgress.strategyApplication} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Trends and Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Brain className="w-5 h-5 mr-2" />
              Key Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.recentTrends.emotionalTrends.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentTrends.emotionalTrends.map((theme, index) => (
                  <Badge key={index} variant="secondary" className="mr-2 mb-2">
                    {theme}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Complete more sessions to see patterns</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Sparkles className="w-5 h-5 mr-2" />
              Successful Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.recentTrends.successfulStrategies.length > 0 ? (
              analytics.recentTrends.successfulStrategies.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-800">{strategy}</span>
                  <Heart className="w-4 h-4 text-green-600" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Try some strategies and rate them to see your successes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Coaching Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Analysis Completed
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
