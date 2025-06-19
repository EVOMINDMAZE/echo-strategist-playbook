
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, SessionData, ChatMessage, SessionStatus } from '@/pages/Index';

export const useSupabaseCoaching = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  // Load targets on mount
  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTargets: Target[] = data.map(target => ({
        id: target.id,
        name: target.target_name,
        created_at: target.created_at
      }));

      setTargets(formattedTargets);
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTarget = async (name: string): Promise<Target> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('targets')
      .insert({ 
        target_name: name,
        user_id: user.id 
      })
      .select()
      .single();

    if (error) throw error;

    const newTarget: Target = {
      id: data.id,
      name: data.target_name,
      created_at: data.created_at
    };

    setTargets(prev => [newTarget, ...prev]);
    return newTarget;
  };

  const createSession = async (targetId: string): Promise<SessionData> => {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({ target_id: targetId })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      target_id: data.target_id,
      status: data.status as SessionStatus,
      messages: Array.isArray(data.raw_chat_history) ? data.raw_chat_history as unknown as ChatMessage[] : [],
      case_data: typeof data.case_file_data === 'object' && data.case_file_data !== null ? data.case_file_data as Record<string, any> : {},
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined
    };
  };

  const sendMessage = async (sessionId: string, message: string, targetName: string) => {
    const { data, error } = await supabase.functions.invoke('handle-user-message', {
      body: { sessionId, message, targetName }
    });

    if (error) throw error;
    return data;
  };

  const triggerStrategist = async (sessionId: string) => {
    const { data, error } = await supabase.functions.invoke('trigger-strategist', {
      body: { sessionId }
    });

    if (error) throw error;
    return data;
  };

  const getSession = async (sessionId: string): Promise<SessionData> => {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      target_id: data.target_id,
      status: data.status as SessionStatus,
      messages: Array.isArray(data.raw_chat_history) ? data.raw_chat_history as unknown as ChatMessage[] : [],
      case_data: typeof data.case_file_data === 'object' && data.case_file_data !== null ? data.case_file_data as Record<string, any> : {},
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined
    };
  };

  return {
    targets,
    loading,
    createTarget,
    createSession,
    sendMessage,
    triggerStrategist,
    getSession
  };
};
