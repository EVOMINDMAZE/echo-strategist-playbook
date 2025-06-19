
import { MobileOptimizedStats } from '@/components/MobileOptimizedStats';

interface QuickStatsGridProps {
  stats: {
    totalChats: number;
    activeClients: number;
    thisWeekSessions: number;
    avgSessionTime: string;
    completionRate: number;
  };
}

export const QuickStatsGrid = ({ stats }: QuickStatsGridProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      <MobileOptimizedStats stats={stats} />
    </div>
  );
};
