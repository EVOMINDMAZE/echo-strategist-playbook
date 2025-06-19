
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  options?: string[];
}

export type SessionStatus = 'gathering_info' | 'analyzing' | 'complete' | 'error';

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  case_data: Record<string, any>;
  strategist_output?: {
    analysis?: string;
    suggestions?: Array<{
      title: string;
      description: string;
      why_it_works: string;
    }>;
  };
}

export const useSupabaseCoaching = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clients on mount
  useEffect(() => {
    loadClients();
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
        created_at: target.created_at
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (name: string): Promise<Client> => {
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

    const newClient: Client = {
      id: data.id,
      name: data.target_name,
      created_at: data.created_at
    };

    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const createSession = async (clientId: string): Promise<SessionData> => {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({ target_id: clientId })
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
      strategist_output: data.strategist_output as { analysis?: string; suggestions?: Array<{ title: string; description: string; why_it_works: string; }>; } | undefined
    };
  };

  return {
    clients,
    loading,
    createClient,
    createSession,
    updateSession,
    sendMessage,
    triggerStrategist,
    getSession
  };
};
