
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Calendar } from "lucide-react";

interface AchievementBadgeProps {
  type: 'streak' | 'milestone' | 'improvement' | 'consistency';
  value: number;
  title: string;
  description: string;
  isNew?: boolean;
  className?: string;
}

const iconMap = {
  streak: Calendar,
  milestone: Trophy,
  improvement: Star,
  consistency: Target
};

const colorMap = {
  streak: "bg-orange-100 text-orange-800 border-orange-200",
  milestone: "bg-yellow-100 text-yellow-800 border-yellow-200",
  improvement: "bg-purple-100 text-purple-800 border-purple-200",
  consistency: "bg-blue-100 text-blue-800 border-blue-200"
};

export const AchievementBadge = ({ 
  type, 
  value, 
  title, 
  description, 
  isNew = false,
  className 
}: AchievementBadgeProps) => {
  const Icon = iconMap[type];
  
  return (
    <div className={cn(
      "relative p-4 rounded-lg border transition-all duration-300 hover:shadow-md",
      colorMap[type],
      className
    )}>
      {isNew && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-red-500 text-white">NEW!</Badge>
        </div>
      )}
      <div className="flex items-center space-x-3">
        <Icon className="w-6 h-6" />
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm opacity-80">{description}</p>
          <div className="text-lg font-bold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
};
