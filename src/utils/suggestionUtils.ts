
import { Clock, Target, Lightbulb, TrendingUp } from 'lucide-react';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'timing': return Clock;
    case 'approach': return Target;
    case 'technique': return Lightbulb;
    case 'follow-up': return TrendingUp;
    default: return Lightbulb;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
