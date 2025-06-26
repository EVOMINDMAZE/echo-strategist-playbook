
import { useState } from 'react';
import { Clock, MessageSquare, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSupabaseCoaching';

interface SessionContinuityHandlerProps {
  previousSessions: SessionData[];
  onFollowUpSelect: (message: string) => void;
}

export const SessionContinuityHandler = ({ 
  previousSessions, 
  onFollowUpSelect 
}: SessionContinuityHandlerProps) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'gathering_info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Completed';
      case 'gathering_info':
        return 'In Progress';
      default:
        return 'Unknown';
    }
  };

  if (!previousSessions.length) return null;

  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Previous Sessions</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {previousSessions.length} sessions
          </Badge>
        </div>
        
        <p className="text-gray-700 mb-4 text-sm leading-relaxed">
          You have previous conversations with this person. Here are some ways we can continue your journey:
        </p>

        <div className="space-y-3">
          {previousSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(session.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-1 ${getStatusColor(session.status)}`}>
                    {getStatusText(session.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSession(
                      expandedSession === session.id ? null : session.id
                    )}
                    className="p-1 h-6 w-6"
                  >
                    {expandedSession === session.id ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                {session.messages.length} messages exchanged
              </div>

              {expandedSession === session.id && session.strategist_output && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-medium text-gray-900 mb-2">Last strategies suggested:</p>
                  <div className="space-y-2">
                    {session.strategist_output.strategies?.slice(0, 2).map((strategy: any, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <Button
                            variant="ghost"
                            onClick={() => onFollowUpSelect(`How did it go when you tried: "${strategy.title}"?`)}
                            className="p-0 h-auto text-left justify-start text-sm text-gray-800 hover:text-blue-600 font-normal break-words whitespace-normal"
                          >
                            <span className="break-words">{strategy.title}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFollowUpSelect("What's new since our last conversation?")}
              className="text-sm border-blue-200 text-gray-800 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              What's new?
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFollowUpSelect("I'd like to continue working on our previous strategies.")}
              className="text-sm border-blue-200 text-gray-800 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              Continue strategies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFollowUpSelect("I have a new situation to discuss.")}
              className="text-sm border-blue-200 text-gray-800 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              New situation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
