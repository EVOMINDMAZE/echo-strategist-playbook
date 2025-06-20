
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Target,
  Crown,
  Zap
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-slate-400 font-medium">Loading your coaching suite...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <AnimationWrapper type="fade-in" delay={0}>
          <DashboardHeader user={user} />
        </AnimationWrapper>

        {/* Elite Branding Message */}
        <AnimationWrapper type="slide-up" delay={50}>
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 text-white border-purple-500/30 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 flex items-center">
                      Your Elite Coaching Suite
                      <Sparkles className="w-5 h-5 ml-2 text-yellow-400" />
                    </h3>
                    <p className="text-purple-100 text-sm">
                      A premium, confidential workspace where relationship mastery meets strategic intelligence
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
                    Professional Edition
                  </Badge>
                  <Zap className="w-5 h-5 text-yellow-400 animate-pulse-soft" />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Tab Navigation */}
        <AnimationWrapper type="slide-up" delay={100}>
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-6 sm:mb-8 max-w-md backdrop-blur-sm border border-slate-700/50">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={`flex-1 transition-all duration-200 ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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

            {/* Coaching Excellence Philosophy */}
            <AnimationWrapper type="slide-up" delay={700}>
              <Card className="mt-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-200">
                    <Heart className="w-5 h-5 mr-2 text-purple-400" />
                    Our Coaching Excellence Philosophy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg glass-effect">
                      <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-200 mb-1">Intelligent Analysis</h4>
                      <p className="text-sm text-slate-400">AI-powered insights that understand the subtleties of human connection</p>
                    </div>
                    <div className="text-center p-4 rounded-lg glass-effect">
                      <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-200 mb-1">Absolute Confidentiality</h4>
                      <p className="text-sm text-slate-400">Your conversations and insights remain completely private and secure</p>
                    </div>
                    <div className="text-center p-4 rounded-lg glass-effect">
                      <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-200 mb-1">Continuous Evolution</h4>
                      <p className="text-sm text-slate-400">Personalized strategies that adapt and grow with your relationship journey</p>
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
