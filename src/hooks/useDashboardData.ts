
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
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    console.log('Loading dashboard data for user:', userId);

    try {
      // Load recent coaching sessions with target names
      const { data: sessions, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          targets (
            target_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
      } else {
        console.log('Sessions loaded:', sessions?.length || 0);
        setRecentActivity(sessions || []);
      }

      // Load comprehensive stats
      await loadComprehensiveStats(userId);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComprehensiveStats = async (userId: string) => {
    try {
      console.log('Loading comprehensive stats for user:', userId);

      // Load all targets for this user
      const { data: targets, error: targetsError } = await supabase
        .from('targets')
        .select('id, target_name, created_at')
        .eq('user_id', userId);

      if (targetsError) {
        console.error('Error loading targets:', targetsError);
        return;
      }

      console.log('Targets loaded:', targets?.length || 0);
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

      // Load all sessions for user's targets
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('coaching_sessions')
        .select('id, status, created_at, updated_at')
        .in('target_id', targetIds);

      if (allSessionsError) {
        console.error('Error loading all sessions:', allSessionsError);
        return;
      }

      console.log('All sessions loaded:', allSessions?.length || 0);

      // Calculate time-based metrics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const thisWeekSessions = allSessions?.filter(s => 
        new Date(s.created_at) > oneWeekAgo
      ).length || 0;

      const completedSessions = allSessions?.filter(s => s.status === 'complete').length || 0;
      const totalSessions = allSessions?.length || 0;

      // Calculate average session duration for completed sessions
      let avgDuration = 0;
      if (completedSessions > 0) {
        const durationsInMinutes = allSessions
          ?.filter(s => s.status === 'complete' && s.updated_at && s.created_at)
          .map(s => {
            const start = new Date(s.created_at);
            const end = new Date(s.updated_at);
            return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60))); // at least 1 minute
          }) || [];
        
        if (durationsInMinutes.length > 0) {
          avgDuration = Math.round(durationsInMinutes.reduce((a, b) => a + b, 0) / durationsInMinutes.length);
        }
      }

      // Calculate completion rate
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      const newStats: QuickStats = {
        totalChats: totalSessions,
        activeClients: targets?.length || 0,
        thisWeekSessions,
        avgSessionTime: avgDuration > 0 ? `${avgDuration} min` : '0 min',
        completionRate
      };

      console.log('Calculated stats:', newStats);
      setQuickStats(newStats);

    } catch (error) {
      console.error('Error calculating comprehensive stats:', error);
    }
  };

  // Load data when userId changes
  useEffect(() => {
    if (userId) {
      console.log('Dashboard data hook: loading data for user', userId);
      loadDashboardData(userId);
    } else {
      setQuickStats({
        totalChats: 0,
        activeClients: 0,
        thisWeekSessions: 0,
        avgSessionTime: '0 min',
        completionRate: 0
      });
      setRecentActivity([]);
      setIsLoading(false);
    }
  }, [userId]);

  // Set up real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'targets', filter: `user_id=eq.${userId}` },
        () => {
          console.log('Targets updated, refreshing dashboard data...');
          loadDashboardData(userId);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'coaching_sessions' },
        () => {
          console.log('Sessions updated, refreshing dashboard data...');
          loadDashboardData(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    recentActivity,
    quickStats,
    isLoading,
    loadDashboardData: () => loadDashboardData(userId)
  };
};
