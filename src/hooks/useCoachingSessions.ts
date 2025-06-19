
import { supabase } from '@/integrations/supabase/client';
import type { SessionData, SessionStatus, ChatMessage } from '@/types/coaching';

export const useCoachingSessions = () => {
  const createSession = async (clientId: string, continueFromSession?: string): Promise<SessionData> => {
    const insertData: any = { target_id: clientId };
    
    if (continueFromSession) {
      insertData.is_continued = true;
      insertData.parent_session_id = continueFromSession;
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      target_id: data.target_id,
      status: data.status as SessionStatus,
      messages: Array.isArray(data.raw_chat_history) ? data.raw_chat_history as unknown as ChatMessage[] : [],
      case_data: typeof data.case_file_data === 'object' && data.case_file_data !== null ? data.case_file_data as Record<string, any> : {},
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined,
      is_continued: data.is_continued || false,
      parent_session_id: data.parent_session_id
    };
  };

  const updateSession = async (sessionId: string, updates: Partial<SessionData>) => {
    const updateData: any = {};
    
    if (updates.messages) {
      updateData.raw_chat_history = updates.messages;
    }
    if (updates.status) {
      updateData.status = updates.status;
    }
    if (updates.case_data) {
      updateData.case_file_data = updates.case_data;
    }
    if (updates.strategist_output) {
      updateData.strategist_output = updates.strategist_output;
    }

    const { error } = await supabase
      .from('coaching_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw error;
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
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined,
      is_continued: data.is_continued || false,
      parent_session_id: data.parent_session_id
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

  return {
    createSession,
    updateSession,
    getSession,
    sendMessage,
    triggerStrategist
  };
};
