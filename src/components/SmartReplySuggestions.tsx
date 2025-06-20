
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

// Enhanced fallback suggestions with better context awareness
const getFallbackSuggestions = (messages: any[]) => {
  const messageCount = messages.length;
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  // Context-aware suggestions based on recent conversation
  if (lastMessage.includes('feel') || lastMessage.includes('emotion')) {
    return [
      { id: 'ctx1', text: "Can you tell me more about how this situation affects you emotionally?", priority: 'high' as const, type: 'emotional_exploration' },
      { id: 'ctx2', text: "What emotions come up for you when you think about this person?", priority: 'medium' as const, type: 'emotional_exploration' },
      { id: 'ctx3', text: "How do you typically handle these feelings?", priority: 'medium' as const, type: 'coping_strategies' }
    ];
  }
  
  if (lastMessage.includes('work') || lastMessage.includes('colleague')) {
    return [
      { id: 'work1', text: "How does this workplace dynamic affect your daily work?", priority: 'high' as const, type: 'workplace_impact' },
      { id: 'work2', text: "What's the professional hierarchy between you and this person?", priority: 'medium' as const, type: 'workplace_context' },
      { id: 'work3', text: "Have you considered speaking with HR or a supervisor about this?", priority: 'medium' as const, type: 'workplace_resources' }
    ];
  }
  
  if (lastMessage.includes('family') || lastMessage.includes('parent') || lastMessage.includes('sibling')) {
    return [
      { id: 'fam1', text: "How long has this family dynamic been an issue?", priority: 'high' as const, type: 'family_history' },
      { id: 'fam2', text: "What role do other family members play in this situation?", priority: 'medium' as const, type: 'family_dynamics' },
      { id: 'fam3', text: "What family traditions or expectations might be influencing this?", priority: 'medium' as const, type: 'family_context' }
    ];
  }
  
  // Default suggestions based on conversation stage
  if (messageCount <= 2) {
    return [
      { id: 'fb1', text: "Can you tell me more about your relationship with this person?", priority: 'high' as const, type: 'context_gathering' },
      { id: 'fb2', text: "What specific situation are you dealing with right now?", priority: 'medium' as const, type: 'situation_clarification' },
      { id: 'fb3', text: "How long have you known each other?", priority: 'medium' as const, type: 'relationship_history' }
    ];
  } else if (messageCount <= 4) {
    return [
      { id: 'fb4', text: "How does this situation make you feel?", priority: 'high' as const, type: 'emotional_exploration' },
      { id: 'fb5', text: "What have you tried before to address this?", priority: 'medium' as const, type: 'previous_attempts' },
      { id: 'fb6', text: "What would an ideal outcome look like for you?", priority: 'medium' as const, type: 'goal_setting' }
    ];
  } else {
    return [
      { id: 'fb7', text: "What's the most challenging aspect of this situation?", priority: 'high' as const, type: 'challenge_identification' },
      { id: 'fb8', text: "Are there any patterns you've noticed in your interactions?", priority: 'medium' as const, type: 'pattern_recognition' },
      { id: 'fb9', text: "What support do you have in dealing with this?", priority: 'medium' as const, type: 'support_assessment' }
    ];
  }
};

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
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    // Only update suggestions if message count changed significantly or we got new AI suggestions
    if (messages.length !== lastMessageCount || suggestions.length > 0) {
      if (suggestions.length > 0) {
        // Remove duplicates from AI suggestions
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
        );
        setDisplayedSuggestions(uniqueSuggestions);
        setUsingFallback(false);
      } else if (!loading && messages.length > 0) {
        // Use enhanced fallback suggestions
        const fallbacks = getFallbackSuggestions(messages);
        setDisplayedSuggestions(fallbacks);
        setUsingFallback(true);
      }
      setLastMessageCount(messages.length);
    }
  }, [suggestions, loading, messages, lastMessageCount]);

  const handleSuggestionClick = async (suggestion: any) => {
    if (!usingFallback) {
      await recordSuggestionClick(suggestion.id, suggestion.text);
    }
    onSuggestionClick(suggestion.text);
  };

  const shuffleSuggestions = () => {
    // For AI suggestions, shuffle; for fallback, get new context-aware ones
    if (usingFallback) {
      const newFallbacks = getFallbackSuggestions(messages);
      setDisplayedSuggestions(newFallbacks);
    } else {
      const shuffled = [...displayedSuggestions].sort(() => Math.random() - 0.5);
      setDisplayedSuggestions(shuffled);
    }
  };

  if (!isVisible || (!loading && displayedSuggestions.length === 0)) {
    return null;
  }

  const getSuggestionTypeLabel = () => {
    const messageCount = messages.length;
    if (messageCount <= 2) return 'Getting Started';
    if (messageCount <= 4) return 'Building Context';
    if (message <6) return 'Exploring Details';
    return 'Deep Dive';
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-sm animate-fade-in mb-4 max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center flex-wrap gap-2">
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {usingFallback ? 'Coaching Questions' : 'AI-Powered Suggestions'}
              </span>
            </div>
            <Badge variant="outline" className="text-xs border-green-300 text-green-600 flex-shrink-0">
              {getSuggestionTypeLabel()}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {!loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={shuffleSuggestions}
                className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 h-6 w-6 p-0 flex-shrink-0"
                title="Get new suggestions"
              >
                <Shuffle className="w-3 h-3" />
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-start space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
            {loading 
              ? 'Generating contextual suggestions...' 
              : usingFallback 
                ? 'Here are some questions to help deepen our conversation:'
                : 'Smart suggestions based on your conversation:'
            }
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
                className={`w-full text-left justify-start text-sm h-auto p-3 border-green-200 hover:bg-green-100 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 leading-relaxed ${
                  suggestion.priority === 'high' ? 'ring-1 ring-green-300' : ''
                }`}
              >
                <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-left break-words flex-1 min-w-0">
                  {suggestion.text}
                </span>
                {suggestion.priority === 'high' && (
                  <Badge className="ml-2 text-xs bg-green-600/20 text-green-700 border-green-500/30 flex-shrink-0">
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
