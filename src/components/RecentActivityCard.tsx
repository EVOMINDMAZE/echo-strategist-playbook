
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MessageSquare } from 'lucide-react';

interface RecentActivityCardProps {
  recentActivity: any[];
}

export const RecentActivityCard = ({ recentActivity }: RecentActivityCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === 'complete' ? 'bg-green-500' : 
                    session.status === 'analyzing' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-sm">
                      {session.targets?.target_name || 'Session'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={session.status === 'complete' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
            ))}
            <Button 
              variant="outline" 
              onClick={() => navigate('/analytics')}
              className="w-full mt-4"
            >
              View All Activity
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No recent activity. Start your first coaching session!
            </p>
            <Button onClick={() => navigate('/clients')}>
              Start First Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
