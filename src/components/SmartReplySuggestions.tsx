
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, ArrowRight, Shuffle, X, Brain, Sparkles } from 'lucide-react';
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
      { id: 'ctx1', text: "I felt confused and hurt when they said that - it caught me completely off guard", priority: 'high' as const, type: 'emotional_response' },
      { id: 'ctx2', text: "It made me question our entire friendship because they've never acted this way before", priority: 'medium' as const, type: 'emotional_impact' },
      { id: 'ctx3', text: "The worst part is that it happened in front of other people, which made it even more embarrassing", priority: 'medium' as const, type: 'situational_detail' }
    ];
  }
  
  if (lastMessage.includes('work') || lastMessage.includes('colleague')) {
    return [
      { id: 'work1', text: "This person is my direct supervisor, so it's affecting my daily work productivity", priority: 'high' as const, type: 'workplace_impact' },
      { id: 'work2', text: "We've worked together for about two years and this behavior started about a month ago", priority: 'medium' as const, type: 'workplace_timeline' },
      { id: 'work3', text: "I'm worried about bringing it to HR because I don't want to make the situation worse", priority: 'medium' as const, type: 'workplace_concern' }
    ];
  }
  
  if (lastMessage.includes('family') || lastMessage.includes('parent') || lastMessage.includes('sibling')) {
    return [
      { id: 'fam1', text: "This has been a pattern since childhood - they always need to be the center of attention", priority: 'high' as const, type: 'family_pattern' },
      { id: 'fam2', text: "The rest of my family pretends nothing happened, which makes me feel like I'm going crazy", priority: 'medium' as const, type: 'family_dynamics' },
      { id: 'fam3', text: "It's especially difficult during holidays when we're all together and I have to act like everything's fine", priority: 'medium' as const, type: 'family_context' }
    ];
  }
  
  // Default contextual suggestions based on conversation stage
  if (messageCount <= 2) {
    return [
      { id: 'fb1', text: "This person is my close friend from college - we've known each other for about 5 years", priority: 'high' as const, type: 'relationship_context' },
      { id: 'fb2', text: "The issue started last week when they completely ignored me at a group gathering", priority: 'medium' as const, type: 'specific_incident' },
      { id: 'fb3', text: "I'm not sure if I did something wrong or if they're going through something personal", priority: 'medium' as const, type: 'uncertainty' }
    ];
  } else if (messageCount <= 4) {
    return [
      { id: 'fb4', text: "I tried texting them yesterday but they left me on read, which isn't like them at all", priority: 'high' as const, type: 'communication_attempt' },
      { id: 'fb5', text: "What bothers me most is that they were fine with me the day before this happened", priority: 'medium' as const, type: 'timing_detail' },
      { id: 'fb6', text: "I'm hoping to resolve this without involving other mutual friends, but I'm running out of options", priority: 'medium' as const, type: 'resolution_preference' }
    ];
  } else {
    return [
      { id: 'fb7', text: "The hardest part is not knowing if this is about something I did or something else entirely", priority: 'high' as const, type: 'core_challenge' },
      { id: 'fb8', text: "I've noticed they do this passive-aggressive thing whenever they're upset about something", priority: 'medium' as const, type: 'behavioral_pattern' },
      { id: 'fb9', text: "My other friends have suggested just giving them space, but that doesn't feel right to me", priority: 'medium' as const, type: 'external_advice' }
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
        // Remove duplicates from AI suggestions and ensure quality
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
    if (messageCount <= 6) return 'Exploring Details';
    return 'Deep Dive';
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-sm animate-fade-in mb-4 max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center flex-wrap gap-2">
            <div className="flex items-center">
              {usingFallback ? (
                <Brain className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
              )}
              <span className="whitespace-nowrap">
                {usingFallback ? 'Smart Responses' : 'AI-Powered Suggestions'}
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
              ? 'Generating intelligent, contextual suggestions...' 
              : usingFallback 
                ? 'Smart response suggestions to help you share relevant details:'
                : 'AI-generated responses based on your conversation context:'
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
                className={`w-full text-left justify-start text-sm h-auto p-3 border-green-200 hover:bg-green-100 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 leading-relaxed transition-all ${
                  suggestion.priority === 'high' ? 'ring-1 ring-green-300 bg-green-50/50' : ''
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
