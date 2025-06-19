
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import type { ContinuableSession } from '@/types/sessionContinuity';

export const useSessionContinuity = (userId: string) => {
  const [continuableSessions, setContinuableSessions] = useState<ContinuableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { createSession } = useSupabaseCoaching();

  useEffect(() => {
    if (userId) {
      loadContinuableSessions();
    }
  }, [userId]);

  const loadContinuableSessions = async () => {
    try {
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          raw_chat_history,
          targets!inner(
            id,
            target_name,
            user_id
          )
        `)
        .eq('targets.user_id', userId)
        .in('status', ['complete', 'analyzing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!sessions) return;

      const analyzedSessions = sessions.map(session => {
        const messageCount = Array.isArray(session.raw_chat_history) ? session.raw_chat_history.length : 0;
        const lastActivity = new Date(session.created_at);
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        let can_continue = false;
        let continuation_reason = '';

        if (session.status === 'complete' && daysSinceActivity <= 7) {
          can_continue = true;
          continuation_reason = 'Recent completed session - follow up available';
        } else if (session.status === 'analyzing' && daysSinceActivity <= 2) {
          can_continue = true;
          continuation_reason = 'Session in progress - continue analysis';
        } else if (messageCount > 3 && daysSinceActivity <= 14) {
          can_continue = true;
          continuation_reason = 'Good conversation foundation - build upon it';
        }

        return {
          id: session.id,
          target_name: session.targets.target_name,
          target_id: session.targets.id,
          last_activity: session.created_at,
          message_count: messageCount,
          status: session.status,
          can_continue,
          continuation_reason
        };
      }).filter(session => session.can_continue);

      setContinuableSessions(analyzedSessions);
    } catch (error) {
      console.error('Error loading continuable sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const continueSession = async (sessionId: string, targetId: string) => {
    try {
      // Use the correct createSession signature (only targetId)
      const newSession = await createSession(targetId);
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error('Error continuing session:', error);
    }
  };

  return {
    continuableSessions,
    loading,
    continueSession,
    loadContinuableSessions
  };
};
