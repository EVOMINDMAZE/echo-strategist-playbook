
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-pulse rounded-full h-12 w-12 bg-primary/20 mx-auto flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-medium">Preparing your coaching suite...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <AnimationWrapper type="fade-in" delay={0}>
          <DashboardHeader user={user} />
        </AnimationWrapper>

        {/* Simple Welcome Card */}
        <AnimationWrapper type="fade-in" delay={50}>
          <Card className="mb-6 sm:mb-8 simple-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground">
                      Your Personal Coaching Journey
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      A thoughtful space where relationship wisdom meets personal growth
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge className="bg-primary text-primary-foreground text-sm">
                    Premium Experience
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Simplified Tab Navigation */}
        <AnimationWrapper type="fade-in" delay={100}>
          <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 sm:mb-8 max-w-md">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={`flex-1 transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
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
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
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

            {/* Simple Philosophy Card */}
            <AnimationWrapper type="fade-in" delay={700}>
              <Card className="mt-8 simple-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Heart className="w-5 h-5 mr-2 text-primary" />
                    Our Human-Centered Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 simple-card">
                      <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Thoughtful Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Gentle insights that honor the complexity of human connection
                      </p>
                    </div>
                    <div className="text-center p-6 simple-card">
                      <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Safe Space</h4>
                      <p className="text-sm text-muted-foreground">
                        Your conversations remain completely private and secure
                      </p>
                    </div>
                    <div className="text-center p-6 simple-card">
                      <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Personal Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Strategies that evolve with your unique relationship journey
                      </p>
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
