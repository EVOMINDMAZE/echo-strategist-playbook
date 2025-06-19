
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, Target, CheckCircle } from 'lucide-react';
import type { SessionData, SessionStatus } from '@/types/coaching';
import { sanitizeChatHistory, validateStrategistOutput } from '@/utils/messageUtils';

interface SessionHistoryLoaderProps {
  targetId: string;
  currentSessionId: string;
  onHistoryLoaded?: (sessions: SessionData[]) => void;
}

export const SessionHistoryLoader = ({ targetId, currentSessionId, onHistoryLoaded }: SessionHistoryLoaderProps) => {
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('target_id', targetId)
          .neq('id', currentSessionId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedSessions: SessionData[] = data.map(session => ({
          id: session.id,
          target_id: session.target_id,
          status: session.status as SessionStatus,
          messages: sanitizeChatHistory(session.raw_chat_history),
          strategist_output: validateStrategistOutput(session.strategist_output),
          case_file_data: session.case_file_data as Record<string, any> || {},
          feedback_data: session.feedback_data as Record<string, any> || {},
          user_feedback: session.user_feedback,
          parent_session_id: session.parent_session_id,
          is_continued: session.is_continued || false,
          feedback_submitted_at: session.feedback_submitted_at,
          feedback_rating: session.feedback_rating,
          created_at: session.created_at,
          case_data: session.case_file_data as Record<string, any> || {}
        }));

        setPreviousSessions(formattedSessions);
        onHistoryLoaded?.(formattedSessions);
      } catch (error) {
        console.error('Error loading session history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionHistory();
  }, [targetId, currentSessionId, onHistoryLoaded]);

  if (loading) {
    return (
      <Card className="mb-6 bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-600 rounded w-3/4"></div>
              <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (previousSessions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Clock className="w-4 h-4 text-slate-400 mr-2" />
          <h3 className="text-sm font-medium text-slate-200">Previous Sessions</h3>
          <Badge variant="outline" className="ml-2 border-slate-600 text-slate-300">
            {previousSessions.length} session{previousSessions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {previousSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-700/30">
              <div className="flex-shrink-0">
                {session.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs border-slate-600 ${
                      session.status === 'complete' ? 'text-green-400' : 'text-blue-400'
                    }`}
                  >
                    {session.status === 'complete' ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                
                {session.messages.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {session.messages.length} message{session.messages.length !== 1 ? 's' : ''} exchanged
                  </p>
                )}
                
                {session.strategist_output?.suggestions && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Last strategies suggested:</p>
                    <div className="flex flex-wrap gap-1">
                      {session.strategist_output.suggestions.slice(0, 2).map((suggestion, index) => (
                        <Badge key={index} className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">
                          <Target className="w-3 h-3 mr-1" />
                          {suggestion.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {session.feedback_rating && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-xs text-slate-400">Feedback:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`text-xs ${i < session.feedback_rating! ? 'text-yellow-400' : 'text-slate-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {previousSessions.length > 3 && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            + {previousSessions.length - 3} more session{previousSessions.length - 3 !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
