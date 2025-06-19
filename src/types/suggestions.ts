
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'timing' | 'approach' | 'technique' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  action_items: string[];
}

export interface IntelligentSuggestionsProps {
  userId: string;
  sessionId?: string;
}
