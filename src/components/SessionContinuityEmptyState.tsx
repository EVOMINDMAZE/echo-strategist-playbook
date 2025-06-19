
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface SessionContinuityEmptyStateProps {
  onStartNewSession: () => void;
}

export const SessionContinuityEmptyState = ({ onStartNewSession }: SessionContinuityEmptyStateProps) => {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Recent Sessions to Continue
      </h3>
      <p className="text-gray-600 mb-4">
        Start a new coaching session or wait for recent sessions to become available for continuation.
      </p>
      <Button onClick={onStartNewSession}>
        Start New Session
      </Button>
    </div>
  );
};
