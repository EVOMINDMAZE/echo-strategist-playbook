
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { SessionStatus } from '@/types/coaching';

interface ChatSessionManagerProps {
  sessionId: string;
  userId: string | null;
  clientName?: string;
  onSessionLoad: (session: SessionData, client: Client) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export const ChatSessionManager = ({
  sessionId,
  userId,
  clientName,
  onSessionLoad,
  onError,
  onLoading
}: ChatSessionManagerProps) => {
  const navigate = useNavigate();
  const { getSession } = useSupabaseCoaching();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      if (!sessionId || !userId) return;

      try {
        onLoading(true);
        onError('');
        console.log('Loading session:', sessionId);
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            onError('Session loading timed out');
            onLoading(false);
          }
        }, 10000);

        const sessionData = await getSession(sessionId);
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.log('Session data loaded successfully');
        
        // Get client information
        let client: Client;
        if (clientName) {
          client = {
            id: sessionData.target_id,
            name: decodeURIComponent(clientName),
            created_at: new Date().toISOString()
          };
        } else {
          // Fetch target information if not in URL
          const { data: targetData, error } = await supabase
            .from('targets')
            .select('*')
            .eq('id', sessionData.target_id)
            .single();
          
          if (targetData && !error && mounted) {
            client = {
              id: targetData.id,
              name: targetData.target_name,
              created_at: targetData.created_at
            };
          } else {
            throw new Error('Could not load client information');
          }
        }

        if (mounted) {
          onSessionLoad(sessionData, client);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) {
          onError('Failed to load session');
        }
      } finally {
        if (mounted) {
          onLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, userId, clientName, getSession, onSessionLoad, onError, onLoading]);

  return null; // This is a logic-only component
};
