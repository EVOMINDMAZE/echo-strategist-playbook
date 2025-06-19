
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionContext {
  id: string;
  relationship_type: string;
  relationship_duration?: string;
  communication_style?: string;
  personality_traits: string[];
  goals: string[];
  challenges: string[];
  previous_attempts: string[];
  context_data: any;
}

export const useIntelligentOnboarding = (sessionId: string) => {
  const [hasContext, setHasContext] = useState<boolean | null>(null);
  const [context, setContext] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForExistingContext();
  }, [sessionId]);

  const checkForExistingContext = async () => {
    try {
      const { data, error } = await supabase
        .from('session_contexts')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setHasContext(!!data);
      setContext(data);
    } catch (error) {
      console.error('Error checking session context:', error);
      setHasContext(false);
    } finally {
      setLoading(false);
    }
  };

  const saveContext = async (contextData: any) => {
    try {
      const { data, error } = await supabase
        .from('session_contexts')
        .upsert({
          session_id: sessionId,
          ...contextData
        })
        .select()
        .single();

      if (error) throw error;

      setContext(data);
      setHasContext(true);
      return data;
    } catch (error) {
      console.error('Error saving session context:', error);
      throw error;
    }
  };

  return {
    hasContext,
    context,
    loading,
    saveContext,
    refetch: checkForExistingContext
  };
};
