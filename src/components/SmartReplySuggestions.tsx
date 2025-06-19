
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, ArrowRight, Shuffle, X } from 'lucide-react';

interface SmartReplySuggestionsProps {
  messageCount: number;
  lastAiMessage?: string;
  onSuggestionClick: (suggestion: string) => void;
  onDismiss?: () => void;
  isVisible: boolean;
}

export const SmartReplySuggestions = ({ 
  messageCount, 
  lastAiMessage, 
  onSuggestionClick, 
  onDismiss,
  isVisible 
}: SmartReplySuggestionsProps) => {
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<string>('');

  useEffect(() => {
    if (!isVisible) return;

    // Generate contextual suggestions based on conversation stage and content
    let suggestions: string[] = [];
    let type = '';

    if (messageCount <= 2) {
      type = 'Getting Started';
      suggestions = [
        "I'm having trouble communicating with my colleague about project deadlines",
        "My manager and I have different working styles and it's causing tension",
        "I want to improve my relationship with a difficult team member",
        "I'm struggling to set boundaries with someone who asks too much of my time"
      ];
    } else if (messageCount <= 4) {
      type = 'Adding Context';
      suggestions = [
        "This has been going on for about 3 months now",
        "I've tried talking to them directly but it didn't help",
        "The situation is affecting my work performance and stress levels",
        "I want to maintain a professional relationship while solving this"
      ];
    } else if (messageCount <= 6) {
      type = 'Specific Details';
      suggestions = [
        "Here's a specific example of what happened last week...",
        "What I really want to achieve is...",
        "The biggest challenge I'm facing is...",
        "I've already tried these approaches but they haven't worked..."
      ];
    } else {
      type = 'Ready for Analysis';
      suggestions = [
        "I think I've shared enough context - can you analyze my situation?",
        "What would you recommend as my next steps?",
        "I'm ready to see what strategies you suggest",
        "Can you help me create an action plan?"
      ];
    }

    setCurrentSuggestions(suggestions);
    setSuggestionType(type);
  }, [messageCount, lastAiMessage, isVisible]);

  const shuffleSuggestions = () => {
    const shuffled = [...currentSuggestions].sort(() => Math.random() - 0.5);
    setCurrentSuggestions(shuffled);
  };

  if (!isVisible || currentSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-sm animate-fade-in mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Suggested Responses
            <Badge variant="outline" className="ml-2 text-xs border-green-300 text-green-600">
              {suggestionType}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={shuffleSuggestions}
              className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 h-6 w-6 p-0"
              title="Shuffle suggestions"
            >
              <Shuffle className="w-3 h-3" />
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 dark:text-green-300">
            Click any suggestion to use it, or use them as inspiration for your own response:
          </p>
        </div>
        
        <div className="space-y-2">
          {currentSuggestions.slice(0, 3).map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left justify-start text-xs h-auto p-3 border-green-200 hover:bg-green-100 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200"
            >
              <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="text-left leading-relaxed">{suggestion}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
