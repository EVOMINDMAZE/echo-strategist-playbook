
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressVisualizationProps {
  userId: string;
}

interface ProgressData {
  weeklyProgress: Array<{ week: string; sessions: number; completion_rate: number }>;
  monthlyTrends: Array<{ month: string; total_sessions: number; avg_rating: number }>;
  milestones: Array<{ title: string; date: string; achieved: boolean }>;
  streakData: { current_streak: number; longest_streak: number; streak_goal: number };
}

export const ProgressVisualization = ({ userId }: ProgressVisualizationProps) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    weeklyProgress: [],
    monthlyTrends: [],
    milestones: [],
    streakData: { current_streak: 0, longest_streak: 0, streak_goal: 7 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // Fetch coaching sessions
        const { data: sessions } = await supabase
          .from('coaching_sessions')
          .select(`
            id,
            status,
            created_at,
            targets!inner(user_id)
          `)
          .eq('targets.user_id', userId)
          .order('created_at', { ascending: true });

        // Fetch user feedback for ratings
        const { data: feedback } = await supabase
          .from('user_feedback')
          .select('rating, created_at')
          .eq('user_id', userId);

        if (sessions) {
          // Calculate weekly progress
          const weeklyData = calculateWeeklyProgress(sessions);
          
          // Calculate monthly trends
          const monthlyData = calculateMonthlyTrends(sessions, feedback || []);
          
          // Calculate milestones
          const milestones = calculateMilestones(sessions);
          
          // Calculate streak data
          const streakData = calculateStreakData(sessions);

          setProgressData({
            weeklyProgress: weeklyData,
            monthlyTrends: monthlyData,
            milestones,
            streakData
          });
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [userId]);

  const calculateWeeklyProgress = (sessions: any[]) => {
    const weeklyMap = new Map();
    
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { total: 0, completed: 0 });
      }
      
      const weekData = weeklyMap.get(weekKey);
      weekData.total += 1;
      if (session.status === 'complete') {
        weekData.completed += 1;
      }
    });

    return Array.from(weeklyMap.entries())
      .slice(-8) // Last 8 weeks
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: data.total,
        completion_rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }));
  };

  const calculateMonthlyTrends = (sessions: any[], feedback: any[]) => {
    const monthlyMap = new Map();
    
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { 
          total_sessions: 0, 
          ratings: [],
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
      }
      
      monthlyMap.get(monthKey).total_sessions += 1;
    });

    feedback.forEach(fb => {
      const date = new Date(fb.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (monthlyMap.has(monthKey)) {
        monthlyMap.get(monthKey).ratings.push(fb.rating);
      }
    });

    return Array.from(monthlyMap.values())
      .slice(-6) // Last 6 months
      .map(data => ({
        month: data.month,
        total_sessions: data.total_sessions,
        avg_rating: data.ratings.length > 0 
          ? Math.round((data.ratings.reduce((a: number, b: number) => a + b, 0) / data.ratings.length) * 10) / 10
          : 0
      }));
  };

  const calculateMilestones = (sessions: any[]) => {
    const milestones = [];
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'complete').length;

    // Session milestones
    [5, 10, 25, 50, 100].forEach(count => {
      milestones.push({
        title: `${count} Total Sessions`,
        date: totalSessions >= count ? sessions[count - 1]?.created_at : '',
        achieved: totalSessions >= count
      });
    });

    // Completion milestones
    [5, 15, 30].forEach(count => {
      milestones.push({
        title: `${count} Completed Sessions`,
        date: completedSessions >= count ? '' : '',
        achieved: completedSessions >= count
      });
    });

    return milestones.slice(0, 6);
  };

  const calculateStreakData = (sessions: any[]) => {
    if (!sessions.length) return { current_streak: 0, longest_streak: 0, streak_goal: 7 };

    const sessionDates = sessions
      .map(s => new Date(s.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sessionDates.length; i++) {
      const prevDate = new Date(sessionDates[i - 1]);
      const currDate = new Date(sessionDates[i]);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak from today backwards
    const today = new Date().toDateString();
    const recentDates = sessionDates.slice(-7);
    currentStreak = recentDates.includes(today) ? Math.min(recentDates.length, 7) : 0;

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      streak_goal: 7
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const chartConfig = {
    sessions: { label: 'Sessions', color: '#3b82f6' },
    completion_rate: { label: 'Completion Rate', color: '#10b981' },
    total_sessions: { label: 'Total Sessions', color: '#8b5cf6' },
    avg_rating: { label: 'Avg Rating', color: '#f59e0b' }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData.weeklyProgress}>
                <XAxis dataKey="week" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="var(--color-sessions)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  stroke="var(--color-completion_rate)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-500" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData.monthlyTrends}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total_sessions" fill="var(--color-total_sessions)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Streak Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-500" />
            Coaching Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Streak</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {progressData.streakData.current_streak} days
            </Badge>
          </div>
          
          <Progress 
            value={(progressData.streakData.current_streak / progressData.streakData.streak_goal) * 100} 
            className="h-3"
          />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Goal: {progressData.streakData.streak_goal} days</span>
            <span>Best: {progressData.streakData.longest_streak} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progressData.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-sm ${
                    milestone.achieved ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {milestone.title}
                  </span>
                </div>
                {milestone.achieved && (
                  <Badge variant="outline" className="text-xs">
                    ✓ Achieved
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
