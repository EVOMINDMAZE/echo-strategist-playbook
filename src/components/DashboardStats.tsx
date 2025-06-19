
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AchievementBadge } from '@/components/ui/achievement-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { TrendingUp, Users, Target, Calendar, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStatsProps {
  userId: string;
}

interface UserStats {
  totalSessions: number;
  completedSessions: number;
  totalClients: number;
  currentStreak: number;
  improvementScore: number;
  achievements: Array<{
    type: 'streak' | 'milestone' | 'improvement' | 'consistency';
    value: number;
    title: string;
    description: string;
    isNew: boolean;
  }>;
}

export const DashboardStats = ({ userId }: DashboardStatsProps) => {
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalClients: 0,
    currentStreak: 0,
    improvementScore: 0,
    achievements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user's coaching statistics
        const { data: sessions } = await supabase
          .from('coaching_sessions')
          .select(`
            *,
            targets!inner(user_id)
          `)
          .eq('targets.user_id', userId);

        const { data: clients } = await supabase
          .from('targets')
          .select('*')
          .eq('user_id', userId);

        const { data: feedback } = await supabase
          .from('user_feedback')
          .select('*')  
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const totalSessions = sessions?.length || 0;
        const completedSessions = sessions?.filter(s => s.status === 'complete').length || 0;
        const totalClients = clients?.length || 0;

        // Calculate streak (simplified - sessions in consecutive days)
        const currentStreak = calculateStreak(sessions || []);
        
        // Calculate improvement score based on feedback trends
        const improvementScore = calculateImprovementScore(feedback || []);

        // Generate achievements
        const achievements = generateAchievements({
          totalSessions,
          completedSessions,
          totalClients,
          currentStreak,
          improvementScore
        });

        setStats({
          totalSessions,
          completedSessions,
          totalClients,
          currentStreak,
          improvementScore,
          achievements
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const calculateStreak = (sessions: any[]) => {
    if (!sessions.length) return 0;
    
    // Simplified streak calculation - count consecutive days with sessions
    const sessionDates = sessions
      .map(s => new Date(s.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort();
    
    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = sessionDates.length - 1; i >= 0; i--) {
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(sessionDates[i]).getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateImprovementScore = (feedback: any[]) => {
    if (!feedback.length) return 0;
    
    const recentFeedback = feedback.slice(0, 10);
    const avgRating = recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / recentFeedback.length;
    
    return Math.round(avgRating * 20); // Convert to 0-100 scale
  };

  const generateAchievements = (data: any) => {
    const achievements = [];
    
    if (data.currentStreak >= 7) {
      achievements.push({
        type: 'streak' as const,
        value: data.currentStreak,
        title: 'Consistency Champion',
        description: `${data.currentStreak} day coaching streak!`,
        isNew: data.currentStreak === 7
      });
    }
    
    if (data.totalSessions >= 10) {
      achievements.push({
        type: 'milestone' as const,
        value: data.totalSessions,
        title: 'Session Master',
        description: `Completed ${data.totalSessions} coaching sessions`,
        isNew: data.totalSessions === 10
      });
    }
    
    if (data.improvementScore >= 80) {
      achievements.push({
        type: 'improvement' as const,
        value: data.improvementScore,
        title: 'Excellence Achiever',
        description: `${data.improvementScore}% satisfaction score`,
        isNew: data.improvementScore >= 80 && data.improvementScore < 85
      });
    }
    
    if (data.totalClients >= 5) {
      achievements.push({
        type: 'consistency' as const,
        value: data.totalClients,
        title: 'Relationship Builder',
        description: `Coaching ${data.totalClients} different clients`,
        isNew: data.totalClients === 5
      });
    }
    
    return achievements;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const progressSteps = ['Start Journey', 'Build Consistency', 'Master Skills', 'Achieve Excellence'];
  const currentProgressStep = Math.min(
    Math.floor((stats.completedSessions / 25) * progressSteps.length), 
    progressSteps.length - 1
  );

  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              <AnimatedCounter end={stats.totalSessions} />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Coaching conversations completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              <AnimatedCounter 
                end={stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0} 
                suffix="%" 
              />
            </div>
            <p className="text-xs text-green-600 mt-1">
              Sessions successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              <AnimatedCounter end={stats.totalClients} />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Relationships being coached
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              <AnimatedCounter end={stats.currentStreak} />
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Consecutive days of coaching
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Journey */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Your Coaching Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressIndicator 
            steps={progressSteps} 
            currentStep={currentProgressStep}
            className="mb-4"
          />
          <div className="text-sm text-gray-600 text-center">
            You're on step {currentProgressStep + 1} of your coaching mastery journey
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <p className="text-sm text-gray-600">
              Celebrating your coaching milestones
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  type={achievement.type}
                  value={achievement.value}
                  title={achievement.title}
                  description={achievement.description}
                  isNew={achievement.isNew}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
