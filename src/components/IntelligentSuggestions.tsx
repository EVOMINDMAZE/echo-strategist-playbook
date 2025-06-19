
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { IntelligentSuggestionsProps } from '@/types/suggestions';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionItem } from '@/components/SuggestionItem';
import { EmptySuggestions } from '@/components/EmptySuggestions';
import { SuggestionsLoading } from '@/components/SuggestionsLoading';

export const IntelligentSuggestions = ({ userId, sessionId }: IntelligentSuggestionsProps) => {
  const { suggestions, loading, appliedSuggestions, applySuggestion } = useSuggestions(userId, sessionId);

  if (loading) {
    return <SuggestionsLoading />;
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
            <EmptySuggestions />
          ) : (
            suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                isApplied={appliedSuggestions.has(suggestion.id)}
                onApply={applySuggestion}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
