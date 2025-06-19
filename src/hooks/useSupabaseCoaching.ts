
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
    const { data, error } = await supabase
      .from('targets')
      .insert([{ target_name: name }])
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
      .insert([{ target_id: targetId }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      target_id: data.target_id,
      status: data.status as SessionStatus,
      messages: data.raw_chat_history || [],
      case_data: data.case_file_data || {},
      strategist_output: data.strategist_output
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
      messages: data.raw_chat_history || [],
      case_data: data.case_file_data || {},
      strategist_output: data.strategist_output
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
