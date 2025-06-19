
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuickStats {
  totalChats: number;
  activeClients: number;
  thisWeekSessions: number;
  avgSessionTime: string;
  completionRate: number;
}

export const useDashboardData = (userId: string) => {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalChats: 0,
    activeClients: 0,
    thisWeekSessions: 0,
    avgSessionTime: '0 min',
    completionRate: 0
  });

  const loadDashboardData = async (userId: string) => {
    try {
      // Load recent coaching sessions
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          targets (
            target_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessions) {
        setRecentActivity(sessions);
      }

      // Load quick stats
      const { data: targets } = await supabase
        .from('targets')
        .select('id')
        .eq('user_id', userId);

      const { data: allSessions } = await supabase
        .from('coaching_sessions')
        .select('id, status, created_at');

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const thisWeekSessions = allSessions?.filter(s => 
        new Date(s.created_at) > thisWeekStart
      ).length || 0;

      const completedSessions = allSessions?.filter(s => s.status === 'complete').length || 0;
      const totalSessions = allSessions?.length || 0;

      setQuickStats({
        totalChats: totalSessions,
        activeClients: targets?.length || 0,
        thisWeekSessions,
        avgSessionTime: '25 min',
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDashboardData(userId);
    }
  }, [userId]);

  return {
    recentActivity,
    quickStats,
    loadDashboardData
  };
};
