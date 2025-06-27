
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
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Heart,
  Users,
  Target,
  MessageSquare,
  Brain,
  Shield,
  TrendingUp
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium">Preparing your coaching suite...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} />
        <SidebarInset className="flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-blue-600" />
              <span>Welcome back, Coach!</span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Welcome Section */}
              <AnimationWrapper type="fade-in" delay={0}>
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, Coach! 👋
                  </h1>
                  <p className="text-gray-600">
                    Ready to make today's coaching sessions impactful?
                  </p>
                </div>
              </AnimationWrapper>

              {/* Welcome Card */}
              <AnimationWrapper type="fade-in" delay={50}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-full">
                          <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1 text-gray-900">
                            Your Personal Coaching Journey
                          </h3>
                          <p className="text-gray-600 text-sm">
                            A thoughtful space where relationship wisdom meets personal growth
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white text-sm px-3 py-1 whitespace-nowrap">
                        Premium Experience
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </AnimationWrapper>

              {/* Tab Navigation */}
              <AnimationWrapper type="fade-in" delay={100}>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 max-w-md">
                  <Button
                    variant={activeTab === 'overview' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 transition-colors ${
                      activeTab === 'overview' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === 'insights' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 transition-colors ${
                      activeTab === 'insights' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Personal Insights
                  </Button>
                </div>
              </AnimationWrapper>

              {/* Tab Content */}
              {activeTab === 'overview' ? (
                <div className="space-y-6">
                  <AnimationWrapper type="fade-in" delay={200}>
                    <QuickStatsGrid stats={quickStats} />
                  </AnimationWrapper>
                  
                  <AnimationWrapper type="fade-in" delay={300}>
                    <AdvancedFeaturesGrid userId={user.id} />
                  </AnimationWrapper>
                  
                  <AnimationWrapper type="fade-in" delay={400}>
                    <QuickActionsGrid 
                      quickStats={quickStats}
                      recentActivity={recentActivity}
                    />
                  </AnimationWrapper>
                  
                  <AnimationWrapper type="fade-in" delay={500}>
                    <RecentActivityCard recentActivity={recentActivity} />
                  </AnimationWrapper>
                  
                  <AnimationWrapper type="fade-in" delay={600}>
                    <DashboardStats userId={user.id} />
                  </AnimationWrapper>

                  {/* Philosophy Card */}
                  <AnimationWrapper type="fade-in" delay={700}>
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                          <Heart className="w-5 h-5 mr-2 text-blue-600" />
                          Our Human-Centered Approach
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
                            <Brain className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                            <h4 className="font-semibold text-gray-900 mb-2">Thoughtful Analysis</h4>
                            <p className="text-sm text-gray-600">
                              Gentle insights that honor the complexity of human connection
                            </p>
                          </div>
                          <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
                            <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <h4 className="font-semibold text-gray-900 mb-2">Safe Space</h4>
                            <p className="text-sm text-gray-600">
                              Your conversations remain completely private and secure
                            </p>
                          </div>
                          <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg">
                            <TrendingUp className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                            <h4 className="font-semibold text-gray-900 mb-2">Personal Growth</h4>
                            <p className="text-sm text-gray-600">
                              Strategies that evolve with your unique relationship journey
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimationWrapper>
                </div>
              ) : (
                <AnimationWrapper type="fade-in" delay={200}>
                  <PersonalInsights userId={user.id} />
                </AnimationWrapper>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
