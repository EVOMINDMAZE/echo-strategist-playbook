
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
            <div className="animate-pulse rounded-full h-12 w-12 bg-primary mx-auto flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="professional-text-primary font-medium">Preparing your coaching suite...</p>
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

        {/* Professional Welcome Message */}
        <AnimationWrapper type="fade-in" delay={50}>
          <Card className="mb-6 sm:mb-8 professional-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-full shadow-professional">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-1 professional-text-primary">
                      Your Personal Coaching Journey
                    </h3>
                    <p className="professional-text-secondary text-sm">
                      A thoughtful space where relationship wisdom meets personal growth
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge variant="info" className="text-sm">
                    Premium Experience
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimationWrapper>

        {/* Professional Tab Navigation */}
        <AnimationWrapper type="fade-in" delay={100}>
          <div className="flex space-x-1 bg-card p-1 rounded-xl mb-6 sm:mb-8 max-w-md shadow-professional border border-border">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={`flex-1 transition-all duration-300 ${
                activeTab === 'overview' 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-professional' 
                  : 'professional-text-primary hover:bg-muted'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'insights' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('insights')}
              className={`flex-1 transition-all duration-300 ${
                activeTab === 'insights' 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-professional' 
                  : 'professional-text-primary hover:bg-muted'
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

            {/* Professional Coaching Philosophy */}
            <AnimationWrapper type="fade-in" delay={700}>
              <Card className="mt-8 professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center professional-text-primary font-serif">
                    <Heart className="w-5 h-5 mr-2 text-primary" />
                    Our Human-Centered Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="professional-grid">
                    <div className="text-center p-6 professional-card">
                      <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h4 className="font-serif font-semibold professional-text-primary mb-2">Thoughtful Analysis</h4>
                      <p className="text-sm professional-text-secondary">
                        Gentle insights that honor the complexity of human connection
                      </p>
                    </div>
                    <div className="text-center p-6 professional-card">
                      <Shield className="w-10 h-10 text-secondary mx-auto mb-3" />
                      <h4 className="font-serif font-semibold professional-text-primary mb-2">Safe Space</h4>
                      <p className="text-sm professional-text-secondary">
                        Your conversations remain completely private and secure
                      </p>
                    </div>
                    <div className="text-center p-6 professional-card">
                      <TrendingUp className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-serif font-semibold professional-text-primary mb-2">Personal Growth</h4>
                      <p className="text-sm professional-text-secondary">
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
