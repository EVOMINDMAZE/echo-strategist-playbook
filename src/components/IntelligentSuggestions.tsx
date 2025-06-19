
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Target, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'timing' | 'approach' | 'technique' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  action_items: string[];
}

interface IntelligentSuggestionsProps {
  userId: string;
  sessionId?: string;
}

export const IntelligentSuggestions = ({ userId, sessionId }: IntelligentSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateIntelligentSuggestions();
  }, [userId, sessionId]);

  const generateIntelligentSuggestions = async () => {
    try {
      // Fetch user's coaching history and patterns
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          feedback_data,
          targets!inner(user_id, target_name)
        `)
        .eq('targets.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Generate intelligent suggestions based on patterns
      const generatedSuggestions = analyzeAndGenerateSuggestions(sessions || [], feedback || []);
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndGenerateSuggestions = (sessions: any[], feedback: any[]): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Analyze session patterns
    const recentSessions = sessions.slice(0, 5);
    const completedSessions = sessions.filter(s => s.status === 'complete');
    const avgSessionsPerWeek = sessions.length / 4; // Rough estimate

    // Timing-based suggestions
    if (avgSessionsPerWeek < 2) {
      suggestions.push({
        id: 'timing-consistency',
        title: 'Increase Session Frequency',
        description: 'Regular coaching sessions lead to better outcomes. Consider scheduling 2-3 sessions per week.',
        category: 'timing',
        priority: 'high',
        reasoning: 'Analysis shows you average less than 2 sessions per week. Consistent practice accelerates growth.',
        action_items: [
          'Schedule recurring coaching sessions',
          'Set reminders for regular practice',
          'Block time in your calendar for coaching'
        ]
      });
    }

    // Feedback-based suggestions
    const lowRatedFeedback = feedback.filter(f => f.rating < 3);
    if (lowRatedFeedback.length > 2) {
      suggestions.push({
        id: 'approach-refinement',
        title: 'Refine Communication Approach',
        description: 'Some recent feedback suggests room for improvement. Let\'s adjust your communication strategy.',
        category: 'approach',
        priority: 'high',
        reasoning: 'Recent feedback indicates effectiveness could be improved with strategy adjustments.',
        action_items: [
          'Review recent session feedback',
          'Try different communication styles',
          'Focus on active listening techniques'
        ]
      });
    }

    // Technique suggestions
    const incompleteSessions = sessions.filter(s => s.status !== 'complete');
    if (incompleteSessions.length > 3) {
      suggestions.push({
        id: 'technique-completion',
        title: 'Improve Session Completion Rate',
        description: 'Several sessions remain incomplete. Let\'s work on strategies to see conversations through.',
        category: 'technique',
        priority: 'medium',
        reasoning: 'Incomplete sessions may indicate need for better conversation flow management.',
        action_items: [
          'Set clear session objectives',
          'Use time management techniques',
          'Practice conversation closure skills'
        ]
      });
    }

    // Follow-up suggestions
    const hasRecentFeedback = feedback.some(f => {
      const feedbackDate = new Date(f.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return feedbackDate > weekAgo;
    });

    if (!hasRecentFeedback && sessions.length > 0) {
      suggestions.push({
        id: 'follow-up-feedback',
        title: 'Collect Recent Feedback',
        description: 'Gathering feedback helps improve future sessions. Consider reaching out for recent session feedback.',
        category: 'follow-up',
        priority: 'medium',
        reasoning: 'No recent feedback collected despite active coaching sessions.',
        action_items: [
          'Send follow-up messages after sessions',
          'Create feedback collection templates',
          'Schedule feedback review meetings'
        ]
      });
    }

    // Success pattern suggestions
    if (completedSessions.length > 5) {
      suggestions.push({
        id: 'technique-advanced',
        title: 'Explore Advanced Techniques',
        description: 'Your completion rate is excellent! Ready to try more advanced coaching approaches.',
        category: 'technique',
        priority: 'low',
        reasoning: 'Strong completion rate indicates readiness for advanced coaching methods.',
        action_items: [
          'Try advanced questioning techniques',
          'Implement solution-focused approaches',
          'Explore coaching frameworks like GROW model'
        ]
      });
    }

    return suggestions;
  };

  const applySuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
    
    // Log suggestion application for analytics
    supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        interaction_type: 'suggestion_applied',
        interaction_data: { suggestion_id: suggestionId },
        session_id: sessionId
      })
      .then(() => console.log('Suggestion application logged'));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timing': return Clock;
      case 'approach': return Target;
      case 'technique': return Lightbulb;
      case 'follow-up': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="w-6 h-6 mr-2 text-blue-500" />
          Intelligent Coaching Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                You're doing great!
              </h3>
              <p className="text-gray-600">
                No specific suggestions at the moment. Keep up the excellent coaching work!
              </p>
            </div>
          ) : (
            suggestions.map((suggestion) => {
              const IconComponent = getCategoryIcon(suggestion.category);
              const isApplied = appliedSuggestions.has(suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isApplied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`capitalize ${getPriorityColor(suggestion.priority)}`}
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Why this helps:</strong> {suggestion.reasoning}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {suggestion.action_items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => applySuggestion(suggestion.id)}
                    disabled={isApplied}
                    size="sm"
                    className={isApplied ? 'bg-green-600 hover:bg-green-600' : ''}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Applied
                      </>
                    ) : (
                      'Apply Suggestion'
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
