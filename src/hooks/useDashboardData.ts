
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
      console.log('Loading dashboard data for user:', userId);

      // Load recent coaching sessions with target names
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
        console.log('Recent sessions loaded:', sessions.length);
        setRecentActivity(sessions);
      }

      // Load stats manually using existing queries
      await loadStatsManually(userId);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to manual loading
      await loadStatsManually(userId);
    }
  };

  const loadStatsManually = async (userId: string) => {
    try {
      console.log('Loading stats manually for user:', userId);

      // Load targets count
      const { data: targets, error: targetsError } = await supabase
        .from('targets')
        .select('id')
        .eq('user_id', userId);

      if (targetsError) {
        console.error('Error loading targets:', targetsError);
        return;
      }

      console.log('Targets loaded:', targets?.length || 0);

      // Load all sessions for this user's targets
      const targetIds = targets?.map(t => t.id) || [];
      
      if (targetIds.length === 0) {
        console.log('No targets found, setting empty stats');
        setQuickStats({
          totalChats: 0,
          activeClients: 0,
          thisWeekSessions: 0,
          avgSessionTime: '0 min',
          completionRate: 0
        });
        return;
      }

      const { data: allSessions, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select('id, status, created_at')
        .in('target_id', targetIds);

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      console.log('Sessions loaded:', allSessions?.length || 0);

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const thisWeekSessions = allSessions?.filter(s => 
        new Date(s.created_at) > thisWeekStart
      ).length || 0;

      const completedSessions = allSessions?.filter(s => s.status === 'complete').length || 0;
      const totalSessions = allSessions?.length || 0;

      const newStats = {
        totalChats: totalSessions,
        activeClients: targets?.length || 0,
        thisWeekSessions,
        avgSessionTime: '25 min',
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      };

      console.log('Updated stats:', newStats);
      setQuickStats(newStats);

    } catch (error) {
      console.error('Error in manual stats loading:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('Dashboard data hook: loading data for user', userId);
      loadDashboardData(userId);
    }
  }, [userId]);

  return {
    recentActivity,
    quickStats,
    loadDashboardData
  };
};
