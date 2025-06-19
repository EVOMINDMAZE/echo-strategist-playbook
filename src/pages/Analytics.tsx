
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { BarChart3, TrendingUp, Clock, Target, MessageSquare, Calendar } from 'lucide-react';

interface Analytics {
  total_sessions: number;
  completed_sessions: number;
  total_clients: number;
  avg_messages_per_session: number;
  recent_sessions: Array<{
    id: string;
    client_name: string;
    status: string;
    created_at: string;
    message_count: number;
  }>;
}

const Analytics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      try {
        // Get user's clients
        const { data: clients, error: clientsError } = await supabase
          .from('targets')
          .select('*')
          .eq('user_id', user.id);
        
        if (clientsError) throw clientsError;

        // Get all sessions for user's clients
        const clientIds = clients?.map(c => c.id) || [];
        
        const { data: sessions, error: sessionsError } = await supabase
          .from('coaching_sessions')
          .select('*')
          .in('target_id', clientIds);
        
        if (sessionsError) throw sessionsError;

        // Calculate analytics
        const totalSessions = sessions?.length || 0;
        const completedSessions = sessions?.filter(s => s.status === 'complete').length || 0;
        const totalClients = clients?.length || 0;
        
        let totalMessages = 0;
        const recentSessions = [];
        
        for (const session of sessions || []) {
          const messageCount = Array.isArray(session.raw_chat_history) 
            ? session.raw_chat_history.length 
            : 0;
          totalMessages += messageCount;
          
          const client = clients?.find(c => c.id === session.target_id);
          if (client) {
            recentSessions.push({
              id: session.id,
              client_name: client.target_name,
              status: session.status,
              created_at: session.created_at,
              message_count: messageCount
            });
          }
        }

        // Sort recent sessions by date
        recentSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setAnalytics({
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          total_clients: totalClients,
          avg_messages_per_session: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
          recent_sessions: recentSessions.slice(0, 10) // Last 10 sessions
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Analytics</h1>
          <p className="mt-2 text-gray-600">
            Detailed insights into your coaching sessions and performance
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics?.total_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                All coaching conversations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.completed_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.total_sessions ? 
                  Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion percentage
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Messages</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics?.avg_messages_per_session || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Active Clients</p>
                      <p className="text-sm text-gray-500">People being coached</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics?.total_clients || 0}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Sessions per Client</p>
                      <p className="text-sm text-gray-500">Average interactions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.total_clients && analytics?.total_sessions ? 
                      Math.round(analytics.total_sessions / analytics.total_clients) : 0}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Improvement Rate</p>
                      <p className="text-sm text-gray-500">Based on completions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics?.total_sessions ? 
                      Math.round((analytics.completed_sessions / analytics.total_sessions) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recent_sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      No sessions yet. Start coaching to see activity here!
                    </p>
                  </div>
                ) : (
                  analytics?.recent_sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{session.client_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'complete' 
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'analyzing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status.replace('_', ' ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
