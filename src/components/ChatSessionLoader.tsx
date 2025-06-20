
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
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      // Prevent multiple simultaneous attempts
      if (hasAttempted || !sessionId || !user) {
        console.log('Skipping session load:', { hasAttempted, sessionId: !!sessionId, user: !!user });
        return;
      }

      setHasAttempted(true);

      try {
        onLoading(true);
        onError('');
        console.log('Loading session:', sessionId);
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('Session loading timed out after 15 seconds');
            onError('Session loading timed out. Please try refreshing the page.');
            onLoading(false);
          }
        }, 15000); // Increased timeout to 15 seconds

        // First verify the session exists and user has access
        const { data: sessionCheck, error: sessionCheckError } = await supabase
          .from('coaching_sessions')
          .select(`
            id,
            target_id,
            targets!inner(user_id, target_name)
          `)
          .eq('id', sessionId)
          .eq('targets.user_id', user.id)
          .single();

        if (sessionCheckError || !sessionCheck) {
          console.error('Session access check failed:', sessionCheckError);
          if (mounted) {
            onError('Session not found or access denied');
            onLoading(false);
          }
          return;
        }

        // Now load the full session data
        const sessionData = await getSession(sessionId);
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.log('Session data loaded successfully:', sessionData);
        
        // Get client name from URL params or use the one from database
        const clientName = searchParams.get('target');
        const client: Client = {
          id: sessionData.target_id,
          name: clientName ? decodeURIComponent(clientName) : sessionCheck.targets.target_name,
          created_at: new Date().toISOString()
        };
        
        console.log('Client information:', client);

        if (mounted) {
          onSessionLoad(sessionData, client);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) {
          onError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (mounted) {
          onLoading(false);
        }
      }
    };

    // Only attempt to load if we haven't tried yet
    if (!hasAttempted) {
      loadSession();
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, user, getSession, searchParams, onSessionLoad, onError, onLoading, hasAttempted]);

  // Reset hasAttempted when sessionId changes
  useEffect(() => {
    setHasAttempted(false);
  }, [sessionId]);

  return null; // This is a logic-only component
};
