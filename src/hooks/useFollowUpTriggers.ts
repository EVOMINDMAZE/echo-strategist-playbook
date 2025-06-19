
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpTrigger {
  id: string;
  trigger_type: string;
  question_text: string;
  context_reference: any;
  is_triggered: boolean;
  created_at: string;
}

export const useFollowUpTriggers = (targetId: string) => {
  const [triggers, setTriggers] = useState<FollowUpTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetId) {
      loadTriggers();
    }
  }, [targetId]);

  const loadTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_up_triggers')
        .select('*')
        .eq('target_id', targetId)
        .eq('is_triggered', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error loading follow-up triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const markTriggered = async (triggerId: string) => {
    try {
      await supabase
        .from('follow_up_triggers')
        .update({ 
          is_triggered: true, 
          triggered_at: new Date().toISOString() 
        })
        .eq('id', triggerId);

      setTriggers(prev => prev.filter(t => t.id !== triggerId));
    } catch (error) {
      console.error('Error marking trigger as used:', error);
    }
  };

  const dismissAll = async () => {
    try {
      const triggerIds = triggers.map(t => t.id);
      if (triggerIds.length > 0) {
        await supabase
          .from('follow_up_triggers')
          .update({ 
            is_triggered: true, 
            triggered_at: new Date().toISOString() 
          })
          .in('id', triggerIds);
      }
      setTriggers([]);
    } catch (error) {
      console.error('Error dismissing all triggers:', error);
    }
  };

  return {
    triggers,
    loading,
    markTriggered,
    dismissAll,
    refetch: loadTriggers
  };
};
