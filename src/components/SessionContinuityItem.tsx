
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Clock, Play } from 'lucide-react';
import { formatTimeAgo, getStatusColor } from '@/utils/sessionContinuityUtils';
import type { ContinuableSession } from '@/types/sessionContinuity';

interface SessionContinuityItemProps {
  session: ContinuableSession;
  onContinue: (sessionId: string, targetId: string) => void;
}

export const SessionContinuityItem = ({ session, onContinue }: SessionContinuityItemProps) => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all hover:shadow-sm">
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
        onClick={() => onContinue(session.id, session.target_id)}
        size="sm"
        className="w-full"
      >
        <Play className="w-4 h-4 mr-2" />
        Continue Session
      </Button>
    </div>
  );
};
