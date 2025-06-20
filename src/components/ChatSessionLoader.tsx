
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { User } from '@supabase/supabase-js';

interface ChatSessionLoaderProps {
  sessionId: string | undefined;
  user: User | null;
  onSessionLoad: (session: SessionData, client: Client) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export const ChatSessionLoader = ({ 
  sessionId, 
  user, 
  onSessionLoad, 
  onError, 
  onLoading 
}: ChatSessionLoaderProps) => {
  const [searchParams] = useSearchParams();
  const { getSession } = useSupabaseCoaching();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      if (!sessionId || !user) {
        console.log('Missing sessionId or user:', { sessionId, userId: user?.id });
        return;
      }

      try {
        onLoading(true);
        onError('');
        console.log('Loading session:', sessionId);
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('Session loading timed out');
            onError('Session loading timed out');
            onLoading(false);
          }
        }, 10000);

        const sessionData = await getSession(sessionId);
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.log('Session data loaded successfully:', sessionData);
        
        // Get client name from URL params or fetch from target
        const clientName = searchParams.get('target');
        let client: Client;
        
        if (clientName) {
          client = {
            id: sessionData.target_id,
            name: decodeURIComponent(clientName),
            created_at: new Date().toISOString()
          };
          console.log('Client set from URL params:', clientName);
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
            console.log('Client set from database:', targetData.target_name);
          } else {
            console.error('Failed to load target data:', error);
            if (mounted) onError('Failed to load client information');
            return;
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
  }, [sessionId, user, getSession, searchParams, onSessionLoad, onError, onLoading]);

  return null; // This is a logic-only component
};
