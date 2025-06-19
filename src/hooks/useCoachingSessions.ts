
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SessionData, SessionStatus, ChatMessage } from '@/types/coaching';
import { sanitizeChatHistory, validateStrategistOutput } from '@/utils/messageUtils';

export const useCoachingSessions = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

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
      messages: sanitizeChatHistory(data.raw_chat_history),
      strategist_output: validateStrategistOutput(data.strategist_output),
      case_file_data: data.case_file_data as Record<string, any> || {},
      feedback_data: data.feedback_data as Record<string, any> || {},
      user_feedback: data.user_feedback,
      parent_session_id: data.parent_session_id,
      is_continued: data.is_continued || false,
      feedback_submitted_at: data.feedback_submitted_at,
      feedback_rating: data.feedback_rating,
      created_at: data.created_at,
      case_data: data.case_file_data as Record<string, any> || {}
    };
  };

  const updateSession = async (sessionId: string, updates: Partial<SessionData>) => {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.messages) updateData.raw_chat_history = updates.messages;
    if (updates.strategist_output) updateData.strategist_output = updates.strategist_output;
    if (updates.case_file_data !== undefined) updateData.case_file_data = updates.case_file_data;
    if (updates.feedback_data !== undefined) updateData.feedback_data = updates.feedback_data;
    if (updates.user_feedback !== undefined) updateData.user_feedback = updates.user_feedback;
    if (updates.is_continued !== undefined) updateData.is_continued = updates.is_continued;
    if (updates.feedback_rating !== undefined) updateData.feedback_rating = updates.feedback_rating;
    if (updates.feedback_submitted_at !== undefined) updateData.feedback_submitted_at = updates.feedback_submitted_at;

    const { error } = await supabase
      .from('coaching_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw error;
  };

  const createSession = async (targetId: string): Promise<SessionData> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        target_id: targetId,
        status: 'gathering_info',
        raw_chat_history: [],
        case_file_data: {},
        feedback_data: {}
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      target_id: data.target_id,
      status: data.status as SessionStatus,
      messages: sanitizeChatHistory(data.raw_chat_history),
      strategist_output: validateStrategistOutput(data.strategist_output),
      case_file_data: data.case_file_data as Record<string, any> || {},
      feedback_data: data.feedback_data as Record<string, any> || {},
      user_feedback: data.user_feedback,
      parent_session_id: data.parent_session_id,
      is_continued: data.is_continued || false,
      feedback_submitted_at: data.feedback_submitted_at,
      feedback_rating: data.feedback_rating,
      created_at: data.created_at,
      case_data: data.case_file_data as Record<string, any> || {}
    };
  };

  const loadUserSessions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          targets!inner(user_id, target_name)
        `)
        .eq('targets.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSessions: SessionData[] = data.map(session => ({
        id: session.id,
        target_id: session.target_id,
        status: session.status as SessionStatus,
        messages: sanitizeChatHistory(session.raw_chat_history),
        strategist_output: validateStrategistOutput(session.strategist_output),
        case_file_data: session.case_file_data as Record<string, any> || {},
        feedback_data: session.feedback_data as Record<string, any> || {},
        user_feedback: session.user_feedback,
        parent_session_id: session.parent_session_id,
        is_continued: session.is_continued || false,
        feedback_submitted_at: session.feedback_submitted_at,
        feedback_rating: session.feedback_rating,
        created_at: session.created_at,
        case_data: session.case_file_data as Record<string, any> || {}
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    loading,
    getSession,
    updateSession,
    createSession,
    loadUserSessions
  };
};
