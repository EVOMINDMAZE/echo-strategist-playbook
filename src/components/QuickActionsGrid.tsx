
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { Sparkles, ArrowRight, BarChart3 } from 'lucide-react';

interface QuickActionsGridProps {
  quickStats: {
    totalChats: number;
    completionRate: number;
    activeClients: number;
  };
  recentActivity: any[];
}

export const QuickActionsGrid = ({ quickStats, recentActivity }: QuickActionsGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
      <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Sparkles className="w-6 h-6 mr-2" />
            Start New Coaching Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 mb-4">
            Begin a new AI-powered coaching conversation with your clients
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/clients')}
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold flex-1"
            >
              Go to Chats <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate('/analytics')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-indigo-600"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      <SmartSuggestions 
        userStats={{
          totalChats: quickStats.totalChats,
          completionRate: quickStats.completionRate,
          activeClients: quickStats.activeClients,
          recentActivity
        }}
      />
    </div>
  );
};
