
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardHeader } from '@/components/DashboardHeader';
import { QuickStatsGrid } from '@/components/QuickStatsGrid';
import { AdvancedFeaturesGrid } from '@/components/AdvancedFeaturesGrid';
import { QuickActionsGrid } from '@/components/QuickActionsGrid';
import { RecentActivityCard } from '@/components/RecentActivityCard';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const { recentActivity, quickStats } = useDashboardData(user?.id || '');

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          setIsLoading(false);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <WorldClassNavigation user={null} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <WorldClassNavigation user={user} />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <AnimationWrapper type="fade-in" delay={0}>
          <DashboardHeader user={user} />
        </AnimationWrapper>
        
        <AnimationWrapper type="slide-up" delay={100}>
          <QuickStatsGrid stats={quickStats} />
        </AnimationWrapper>
        
        <AnimationWrapper type="slide-up" delay={200}>
          <AdvancedFeaturesGrid userId={user.id} />
        </AnimationWrapper>
        
        <AnimationWrapper type="slide-up" delay={300}>
          <QuickActionsGrid 
            quickStats={quickStats}
            recentActivity={recentActivity}
          />
        </AnimationWrapper>
        
        <AnimationWrapper type="slide-up" delay={400}>
          <RecentActivityCard recentActivity={recentActivity} />
        </AnimationWrapper>
        
        <AnimationWrapper type="slide-up" delay={500}>
          <DashboardStats userId={user.id} />
        </AnimationWrapper>
      </div>
    </div>
  );
};

export default Dashboard;
