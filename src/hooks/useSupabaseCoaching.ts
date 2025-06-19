import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Client, ChatMessage, SessionStatus, SessionData } from '@/types/coaching';

export type { Client, ChatMessage, SessionStatus, SessionData };

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  is_read: boolean;
  created_at: string;
}

export const useSupabaseCoaching = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clients and notifications on mount
  useEffect(() => {
    loadClients();
    loadNotifications();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedClients: Client[] = data.map(target => ({
        id: target.id,
        name: target.target_name,
        created_at: target.created_at,
        is_favorite: target.is_favorite || false
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const createClient = async (name: string): Promise<Client> => {
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

    const newClient: Client = {
      id: data.id,
      name: data.target_name,
      created_at: data.created_at,
      is_favorite: data.is_favorite || false
    };

    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const toggleFavorite = async (clientId: string): Promise<void> => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newFavoriteStatus = !client.is_favorite;

    const { error } = await supabase
      .from('targets')
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', clientId);

    if (error) throw error;

    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, is_favorite: newFavoriteStatus } : c
    ));
  };

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

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
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
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined,
      is_continued: data.is_continued || false,
      parent_session_id: data.parent_session_id
    };
  };

  return {
    clients,
    notifications,
    loading,
    createClient,
    toggleFavorite,
    createSession,
    updateSession,
    sendMessage,
    triggerStrategist,
    getSession,
    loadNotifications,
    markNotificationAsRead
  };
};
