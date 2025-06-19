
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MessageSquare, Users, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';

interface SessionContinuityProps {
  userId: string;
}

interface ContinuableSession {
  id: string;
  target_name: string;
  target_id: string;
  last_activity: string;
  message_count: number;
  status: string;
  can_continue: boolean;
  continuation_reason: string;
}

export const SessionContinuity = ({ userId }: SessionContinuityProps) => {
  const [continuableSessions, setContinuableSessions] = useState<ContinuableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { createSession } = useSupabaseCoaching();

  useEffect(() => {
    loadContinuableSessions();
  }, [userId]);

  const loadContinuableSessions = async () => {
    try {
      // Fetch recent sessions that could be continued
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          status,
          created_at,
          raw_chat_history,
          targets!inner(
            id,
            target_name,
            user_id
          )
        `)
        .eq('targets.user_id', userId)
        .in('status', ['complete', 'analyzing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!sessions) return;

      // Analyze sessions for continuation potential
      const analyzedSessions = sessions.map(session => {
        const messageCount = Array.isArray(session.raw_chat_history) ? session.raw_chat_history.length : 0;
        const lastActivity = new Date(session.created_at);
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        let can_continue = false;
        let continuation_reason = '';

        // Logic to determine if session can be continued
        if (session.status === 'complete' && daysSinceActivity <= 7) {
          can_continue = true;
          continuation_reason = 'Recent completed session - follow up available';
        } else if (session.status === 'analyzing' && daysSinceActivity <= 2) {
          can_continue = true;
          continuation_reason = 'Session in progress - continue analysis';
        } else if (messageCount > 3 && daysSinceActivity <= 14) {
          can_continue = true;
          continuation_reason = 'Good conversation foundation - build upon it';
        }

        return {
          id: session.id,
          target_name: session.targets.target_name,
          target_id: session.targets.id,
          last_activity: session.created_at,
          message_count: messageCount,
          status: session.status,
          can_continue,
          continuation_reason
        };
      }).filter(session => session.can_continue);

      setContinuableSessions(analyzedSessions);
    } catch (error) {
      console.error('Error loading continuable sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const continueSession = async (sessionId: string, targetId: string) => {
    try {
      // Create a new session that continues from the previous one
      const newSession = await createSession(targetId, sessionId);
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error('Error continuing session:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowRight className="w-6 h-6 mr-2 text-blue-500" />
          Continue Previous Sessions
        </CardTitle>
        <p className="text-sm text-gray-600">
          Build upon your recent coaching conversations
        </p>
      </CardHeader>
      <CardContent>
        {continuableSessions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Recent Sessions to Continue
            </h3>
            <p className="text-gray-600 mb-4">
              Start a new coaching session or wait for recent sessions to become available for continuation.
            </p>
            <Button onClick={() => navigate('/clients')}>
              Start New Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {continuableSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.target_name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatTimeAgo(session.last_activity)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {session.message_count} messages
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {session.status}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">
                  {session.continuation_reason}
                </p>

                <Button
                  onClick={() => continueSession(session.id, session.target_id)}
                  size="sm"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continue Session
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
