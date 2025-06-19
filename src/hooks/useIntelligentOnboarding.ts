
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

      if (data) {
        // Convert the data to match our interface
        const convertedData: SessionContext = {
          id: data.id,
          relationship_type: data.relationship_type,
          relationship_duration: data.relationship_duration,
          communication_style: data.communication_style,
          personality_traits: Array.isArray(data.personality_traits) ? data.personality_traits : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          challenges: Array.isArray(data.challenges) ? data.challenges : [],
          previous_attempts: Array.isArray(data.previous_attempts) ? data.previous_attempts : [],
          context_data: data.context_data || {}
        };
        setContext(convertedData);
      }

      setHasContext(!!data);
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

      // Convert the returned data to match our interface
      if (data) {
        const convertedData: SessionContext = {
          id: data.id,
          relationship_type: data.relationship_type,
          relationship_duration: data.relationship_duration,
          communication_style: data.communication_style,
          personality_traits: Array.isArray(data.personality_traits) ? data.personality_traits : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          challenges: Array.isArray(data.challenges) ? data.challenges : [],
          previous_attempts: Array.isArray(data.previous_attempts) ? data.previous_attempts : [],
          context_data: data.context_data || {}
        };
        setContext(convertedData);
      }

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
