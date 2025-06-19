
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SmartSuggestion {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
}

interface UseSmartSuggestionsProps {
  sessionId: string;
  targetId: string;
  messages: Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>;
  isVisible: boolean;
}

export const useSmartSuggestions = ({ 
  sessionId, 
  targetId, 
  messages, 
  isVisible 
}: UseSmartSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible || messages.length === 0) {
      setSuggestions([]);
      return;
    }

    generateSuggestions();
  }, [sessionId, targetId, messages.length, isVisible]);

  const generateSuggestions = async () => {
    if (messages.length === 0) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const lastAiMessage = messages
        .filter(m => m.sender === 'ai')
        .pop()?.content;

      const response = await supabase.functions.invoke('generate-intelligent-suggestions', {
        body: {
          sessionId,
          targetId,
          messages: messages.slice(-10), // Send last 10 messages
          messageCount: messages.length,
          lastAiMessage
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordSuggestionClick = async (suggestionId: string, suggestionText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record the interaction
      await supabase
        .from('suggestion_interactions')
        .insert({
          suggestion_id: suggestionId,
          session_id: sessionId,
          user_id: user.id,
          target_id: targetId,
          follow_up_context: {
            selected_text: suggestionText,
            message_count_at_selection: messages.length
          }
        });

      console.log('Suggestion interaction recorded:', suggestionId);
    } catch (error) {
      console.error('Error recording suggestion click:', error);
    }
  };

  const markSuggestionEffective = async (suggestionId: string, wasEffective: boolean) => {
    try {
      await supabase
        .from('suggestion_interactions')
        .update({ was_effective: wasEffective })
        .eq('suggestion_id', suggestionId);
    } catch (error) {
      console.error('Error updating suggestion effectiveness:', error);
    }
  };

  return {
    suggestions,
    loading,
    recordSuggestionClick,
    markSuggestionEffective,
    refreshSuggestions: generateSuggestions
  };
};
