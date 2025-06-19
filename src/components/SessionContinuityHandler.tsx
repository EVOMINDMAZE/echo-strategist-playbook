
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, Target, ArrowRight } from 'lucide-react';
import type { SessionData } from '@/types/coaching';

interface SessionContinuityHandlerProps {
  previousSessions: SessionData[];
  onFollowUpSelect: (question: string, context: any) => void;
}

export const SessionContinuityHandler = ({ previousSessions, onFollowUpSelect }: SessionContinuityHandlerProps) => {
  const [followUpQuestions, setFollowUpQuestions] = useState<Array<{
    question: string;
    context: any;
    priority: 'high' | 'medium' | 'low';
  }>>([]);

  useEffect(() => {
    if (previousSessions.length === 0) return;

    const questions: Array<{
      question: string;
      context: any;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Get the most recent completed session
    const lastCompletedSession = previousSessions.find(s => s.status === 'complete');
    
    if (lastCompletedSession?.strategist_output?.suggestions) {
      lastCompletedSession.strategist_output.suggestions.forEach((suggestion, index) => {
        questions.push({
          question: `How did it go when you tried: "${suggestion.title}"?`,
          context: {
            type: 'strategy_follow_up',
            suggestion,
            sessionId: lastCompletedSession.id,
            sessionDate: lastCompletedSession.created_at
          },
          priority: index === 0 ? 'high' : 'medium'
        });
      });
    }

    // Add general follow-up questions
    if (lastCompletedSession) {
      const daysSince = Math.floor((Date.now() - new Date(lastCompletedSession.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince <= 7) {
        questions.push({
          question: `It's been ${daysSince} day${daysSince !== 1 ? 's' : ''} since our last session. What's been happening?`,
          context: {
            type: 'general_follow_up',
            sessionId: lastCompletedSession.id,
            daysSince
          },
          priority: 'medium'
        });
      }
    }

    // Sort by priority
    questions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setFollowUpQuestions(questions.slice(0, 3)); // Show top 3 questions
  }, [previousSessions]);

  if (followUpQuestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border-purple-700/50">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <ArrowRight className="w-4 h-4 text-purple-400 mr-2" />
          <h3 className="text-sm font-medium text-purple-200">Let's Continue Where We Left Off</h3>
          <Badge variant="outline" className="ml-2 border-purple-500 text-purple-300">
            Follow-up
          </Badge>
        </div>
        
        <p className="text-xs text-purple-300 mb-4">
          Based on your previous sessions, here are some questions to help us continue your journey:
        </p>
        
        <div className="space-y-2">
          {followUpQuestions.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full text-left justify-start h-auto p-3 border-purple-600/50 hover:border-purple-500 hover:bg-purple-800/20 text-purple-100"
              onClick={() => onFollowUpSelect(item.question, item.context)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  {item.context.type === 'strategy_follow_up' ? (
                    <Target className="w-4 h-4 text-purple-400" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-purple-100 leading-relaxed">
                    {item.question}
                  </p>
                  {item.context.type === 'strategy_follow_up' && (
                    <p className="text-xs text-purple-400 mt-1">
                      Strategy from {new Date(item.context.sessionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge 
                  className={`text-xs ${
                    item.priority === 'high' 
                      ? 'bg-red-600/20 text-red-300 border-red-500/30' 
                      : 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {item.priority}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-purple-400 mt-4 text-center">
          Click any question to start the conversation, or type your own message below
        </p>
      </CardContent>
    </Card>
  );
};
