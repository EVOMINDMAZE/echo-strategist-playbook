
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardHeader } from '@/components/DashboardHeader';
import { QuickStatsGrid } from '@/components/QuickStatsGrid';
import { AdvancedFeaturesGrid } from '@/components/AdvancedFeaturesGrid';
import { QuickActionsGrid } from '@/components/QuickActionsGrid';
import { RecentActivityCard } from '@/components/RecentActivityCard';
import { PersonalInsights } from '@/components/PersonalInsights';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Sparkles, 
  Shield, 
  Brain, 
  Heart,
  TrendingUp,
  MessageSquare,
  Users,
  Target
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
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

        {/* Branding Message */}
        <AnimationWrapper type="slide-up" delay={50}>
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Your Secret Coaching Room</h3>
                    <p className="text-indigo-100 text-sm">
                      A private, intelligent space where relationships flourish through strategic insights
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Tab Navigation */}
        <AnimationWrapper type="slide-up" delay={100}>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 sm:mb-8 max-w-md">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={`flex-1 transition-all duration-200 ${
                activeTab === 'overview' 
                  ? 'bg-white shadow-sm text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'insights' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('insights')}
              className={`flex-1 transition-all duration-200 ${
                activeTab === 'insights' 
                  ? 'bg-white shadow-sm text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Brain className="w-4 h-4 mr-2" />
              Personal Insights
            </Button>
          </div>
        </AnimationWrapper>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            <AnimationWrapper type="slide-up" delay={200}>
              <QuickStatsGrid stats={quickStats} />
            </AnimationWrapper>
            
            <AnimationWrapper type="slide-up" delay={300}>
              <AdvancedFeaturesGrid userId={user.id} />
            </AnimationWrapper>
            
            <AnimationWrapper type="slide-up" delay={400}>
              <QuickActionsGrid 
                quickStats={quickStats}
                recentActivity={recentActivity}
              />
            </AnimationWrapper>
            
            <AnimationWrapper type="slide-up" delay={500}>
              <RecentActivityCard recentActivity={recentActivity} />
            </AnimationWrapper>
            
            <AnimationWrapper type="slide-up" delay={600}>
              <DashboardStats userId={user.id} />
            </AnimationWrapper>

            {/* Coaching Philosophy */}
            <AnimationWrapper type="slide-up" delay={700}>
              <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <Heart className="w-5 h-5 mr-2" />
                    Our Coaching Philosophy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4">
                      <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-800 mb-1">Intelligent Analysis</h4>
                      <p className="text-sm text-purple-600">AI-powered insights that understand the nuances of human relationships</p>
                    </div>
                    <div className="text-center p-4">
                      <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-800 mb-1">Complete Privacy</h4>
                      <p className="text-sm text-purple-600">Your conversations and insights remain completely confidential</p>
                    </div>
                    <div className="text-center p-4">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-800 mb-1">Continuous Growth</h4>
                      <p className="text-sm text-purple-600">Personalized strategies that evolve with your relationship journey</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimationWrapper>
          </>
        ) : (
          <AnimationWrapper type="fade-in" delay={200}>
            <PersonalInsights userId={user.id} />
          </AnimationWrapper>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
