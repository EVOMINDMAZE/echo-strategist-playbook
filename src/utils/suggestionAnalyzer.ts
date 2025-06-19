
import { Suggestion } from '@/types/suggestions';

export const analyzeAndGenerateSuggestions = (sessions: any[], feedback: any[]): Suggestion[] => {
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
