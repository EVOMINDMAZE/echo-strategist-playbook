
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, MessageSquare, TrendingUp } from 'lucide-react';
import { SessionData } from '@/types/coaching';

interface SmartFeedbackPromptsProps {
  session: SessionData;
  onPromptSelect: (prompt: string) => void;
}

interface SmartPrompt {
  text: string;
  category: 'outcome' | 'strategy' | 'insight';
  icon: React.ReactNode;
  color: string;
}

export const SmartFeedbackPrompts = ({ session, onPromptSelect }: SmartFeedbackPromptsProps) => {
  const [prompts, setPrompts] = useState<SmartPrompt[]>([]);

  useEffect(() => {
    const generateSmartPrompts = () => {
      const suggestions = session.strategist_output?.suggestions || [];
      const messageCount = session.messages.length;
      
      const generatedPrompts: SmartPrompt[] = [];

      // Outcome-based prompts
      if (suggestions.length > 0) {
        generatedPrompts.push({
          text: `How did the "${suggestions[0].title}" strategy work for you?`,
          category: 'outcome',
          icon: <TrendingUp className="w-4 h-4" />,
          color: 'bg-green-100 text-green-700 border-green-200'
        });
      }

      // Strategy-specific prompts
      if (suggestions.length > 1) {
        generatedPrompts.push({
          text: `Which of the suggested approaches felt most natural to you?`,
          category: 'strategy',
          icon: <Lightbulb className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        });
      }

      // Insight prompts based on conversation length
      if (messageCount > 6) {
        generatedPrompts.push({
          text: `What surprised you most about the analysis of your situation?`,
          category: 'insight',
          icon: <MessageSquare className="w-4 h-4" />,
          color: 'bg-purple-100 text-purple-700 border-purple-200'
        });
      }

      // General prompts
      generatedPrompts.push(
        {
          text: `What would you want to know before your next conversation?`,
          category: 'insight',
          icon: <MessageSquare className="w-4 h-4" />,
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        },
        {
          text: `How confident do you feel about implementing these strategies?`,
          category: 'outcome',
          icon: <TrendingUp className="w-4 h-4" />,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        }
      );

      setPrompts(generatedPrompts.slice(0, 4)); // Limit to 4 prompts
    };

    generateSmartPrompts();
  }, [session]);

  if (prompts.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500 mr-2" />
          <h3 className="font-semibold text-slate-800">Quick Feedback Prompts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className={`${prompt.color} h-auto p-3 text-left justify-start hover:shadow-md transition-all duration-200`}
              onClick={() => onPromptSelect(prompt.text)}
            >
              <div className="flex items-start space-x-2">
                {prompt.icon}
                <div className="flex-1">
                  <span className="text-sm leading-relaxed">{prompt.text}</span>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {prompt.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
