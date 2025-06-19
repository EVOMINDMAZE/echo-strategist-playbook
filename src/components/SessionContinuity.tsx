
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useSessionContinuity } from '@/hooks/useSessionContinuity';
import { SessionContinuityItem } from '@/components/SessionContinuityItem';
import { SessionContinuityEmptyState } from '@/components/SessionContinuityEmptyState';
import { SessionContinuityLoading } from '@/components/SessionContinuityLoading';

interface SessionContinuityProps {
  userId: string;
}

export const SessionContinuity = ({ userId }: SessionContinuityProps) => {
  const navigate = useNavigate();
  const { continuableSessions, loading, continueSession } = useSessionContinuity(userId);

  if (loading) {
    return <SessionContinuityLoading />;
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
          <SessionContinuityEmptyState 
            onStartNewSession={() => navigate('/clients')}
          />
        ) : (
          <div className="space-y-4">
            {continuableSessions.map((session) => (
              <SessionContinuityItem
                key={session.id}
                session={session}
                onContinue={continueSession}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
