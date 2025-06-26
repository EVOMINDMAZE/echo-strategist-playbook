
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, Target, ArrowRight, Clock } from 'lucide-react';
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
    <Card className="mb-6 bg-white border-2 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Let's Continue Where We Left Off</h3>
          <Badge className="ml-3 bg-blue-100 text-blue-800 border-blue-300">
            Follow-up
          </Badge>
        </div>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Based on your previous sessions, here are some questions to help us continue your journey:
        </p>
        
        <div className="space-y-3">
          {followUpQuestions.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full text-left justify-start h-auto p-4 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-800 transition-all duration-200"
              onClick={() => onFollowUpSelect(item.question, item.context)}
            >
              <div className="flex items-start space-x-4 w-full">
                <div className="flex-shrink-0 mt-1">
                  {item.context.type === 'strategy_follow_up' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {item.question}
                  </p>
                  {item.context.type === 'strategy_follow_up' && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Strategy from {new Date(item.context.sessionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge 
                  className={`text-xs font-medium ${
                    item.priority === 'high' 
                      ? 'bg-red-100 text-red-700 border-red-300' 
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                  }`}
                >
                  {item.priority}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 text-center">
            Click any question to start the conversation, or type your own message below
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
