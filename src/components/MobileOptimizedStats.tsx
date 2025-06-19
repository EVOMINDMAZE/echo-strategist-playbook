
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Calendar, MessageSquare, Clock } from 'lucide-react';

interface MobileStatsProps {
  stats: {
    totalChats: number;
    activeClients: number;
    thisWeekSessions: number;
    avgSessionTime: string;
    completionRate: number;
  };
}

export const MobileOptimizedStats = ({ stats }: MobileStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <MessageSquare className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500 mb-1 sm:mb-2" />
            <p className="text-blue-600 text-xs sm:text-sm font-medium">Chats</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-900">{stats.totalChats}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <Target className="w-5 h-5 sm:w-8 sm:h-8 text-green-500 mb-1 sm:mb-2" />
            <p className="text-green-600 text-xs sm:text-sm font-medium">Success</p>
            <p className="text-xl sm:text-3xl font-bold text-green-900">{stats.completionRate}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <Users className="w-5 h-5 sm:w-8 sm:h-8 text-purple-500 mb-1 sm:mb-2" />
            <p className="text-purple-600 text-xs sm:text-sm font-medium">Clients</p>
            <p className="text-xl sm:text-3xl font-bold text-purple-900">{stats.activeClients}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <Calendar className="w-5 h-5 sm:w-8 sm:h-8 text-orange-500 mb-1 sm:mb-2" />
            <p className="text-orange-600 text-xs sm:text-sm font-medium">This Week</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-900">{stats.thisWeekSessions}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
