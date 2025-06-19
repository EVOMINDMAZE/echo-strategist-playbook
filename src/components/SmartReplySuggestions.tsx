
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, ArrowRight, Shuffle, X, Brain } from 'lucide-react';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';

interface SmartReplySuggestionsProps {
  sessionId: string;
  targetId: string;
  messages: Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>;
  onSuggestionClick: (suggestion: string) => void;
  onDismiss?: () => void;
  isVisible: boolean;
}

export const SmartReplySuggestions = ({ 
  sessionId,
  targetId,
  messages,
  onSuggestionClick, 
  onDismiss,
  isVisible 
}: SmartReplySuggestionsProps) => {
  const { suggestions, loading, recordSuggestionClick } = useSmartSuggestions({
    sessionId,
    targetId,
    messages,
    isVisible
  });

  const [displayedSuggestions, setDisplayedSuggestions] = useState(suggestions);

  useEffect(() => {
    setDisplayedSuggestions(suggestions);
  }, [suggestions]);

  const handleSuggestionClick = async (suggestion: any) => {
    await recordSuggestionClick(suggestion.id, suggestion.text);
    onSuggestionClick(suggestion.text);
  };

  const shuffleSuggestions = () => {
    const shuffled = [...displayedSuggestions].sort(() => Math.random() - 0.5);
    setDisplayedSuggestions(shuffled);
  };

  if (!isVisible || (!loading && displayedSuggestions.length === 0)) {
    return null;
  }

  const getSuggestionTypeLabel = () => {
    const messageCount = messages.length;
    if (messageCount <= 2) return 'Getting Started';
    if (messageCount <= 4) return 'Adding Context';
    if (messageCount <= 6) return 'Specific Details';
    return 'Deep Dive';
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-sm animate-fade-in mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Suggestions
            <Badge variant="outline" className="ml-2 text-xs border-green-300 text-green-600">
              {getSuggestionTypeLabel()}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-1">
            {!loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={shuffleSuggestions}
                className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 h-6 w-6 p-0"
                title="Shuffle suggestions"
              >
                <Shuffle className="w-3 h-3" />
              </Button>
            )}
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
            {loading ? 'Generating contextual suggestions...' : 'Smart suggestions based on your conversation:'}
          </p>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-green-100/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedSuggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={suggestion.id || index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left justify-start text-xs h-auto p-3 border-green-200 hover:bg-green-100 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 ${
                  suggestion.priority === 'high' ? 'ring-1 ring-green-300' : ''
                }`}
              >
                <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="text-left leading-relaxed">{suggestion.text}</span>
                {suggestion.priority === 'high' && (
                  <Badge className="ml-auto text-xs bg-green-600/20 text-green-700 border-green-500/30">
                    Priority
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
