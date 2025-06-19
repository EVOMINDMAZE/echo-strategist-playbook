
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Suggestion } from '@/types/suggestions';
import { analyzeAndGenerateSuggestions } from '@/utils/suggestionAnalyzer';

export const useSuggestions = (userId: string, sessionId?: string) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateIntelligentSuggestions();
  }, [userId, sessionId]);

  const generateIntelligentSuggestions = async () => {
    try {
      // Fetch user's coaching history and patterns
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          feedback_data,
          targets!inner(user_id, target_name)
        `)
        .eq('targets.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Generate intelligent suggestions based on patterns
      const generatedSuggestions = analyzeAndGenerateSuggestions(sessions || [], feedback || []);
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
    
    // Log suggestion application for analytics (simplified logging)
    console.log('Suggestion applied:', { suggestion_id: suggestionId, user_id: userId, session_id: sessionId });
  };

  return {
    suggestions,
    loading,
    appliedSuggestions,
    applySuggestion
  };
};
