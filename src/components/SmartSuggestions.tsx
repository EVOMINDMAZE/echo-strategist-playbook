
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SmartSuggestionsProps {
  userStats: {
    totalChats: number;
    completionRate: number;
    activeClients: number;
    recentActivity: any[];
  };
}

export const SmartSuggestions = ({ userStats }: SmartSuggestionsProps) => {
  const navigate = useNavigate();

  const generateSuggestions = () => {
    const suggestions = [];

    if (userStats.totalChats === 0) {
      suggestions.push({
        type: 'getting-started',
        icon: Sparkles,
        title: 'Start Your First Coaching Session',
        description: 'Begin your coaching journey with our AI-powered assistant',
        action: 'Start Now',
        actionPath: '/clients',
        priority: 'high'
      });
    }

    if (userStats.completionRate < 50 && userStats.totalChats > 2) {
      suggestions.push({
        type: 'improvement',
        icon: TrendingUp,
        title: 'Improve Session Completion',
        description: 'Your completion rate is below average. Try shorter, focused sessions',
        action: 'View Tips',
        actionPath: '/analytics',
        priority: 'medium'
      });
    }

    if (userStats.activeClients < 3) {
      suggestions.push({
        type: 'growth',
        icon: Users,
        title: 'Add More Coaching Targets',
        description: 'Expand your coaching practice by adding more clients',
        action: 'Add Target',
        actionPath: '/clients',
        priority: 'low'
      });
    }

    if (userStats.recentActivity.length === 0) {
      suggestions.push({
        type: 'engagement',
        icon: MessageSquare,
        title: 'Stay Consistent',
        description: 'Regular sessions lead to better outcomes. Schedule your next session',
        action: 'Schedule',
        actionPath: '/clients',
        priority: 'medium'
      });
    }

    if (userStats.completionRate > 80 && userStats.totalChats > 5) {
      suggestions.push({
        type: 'advanced',
        icon: Target,
        title: 'Explore Advanced Features',
        description: 'You\'re doing great! Discover advanced coaching techniques',
        action: 'Explore',
        actionPath: '/analytics',
        priority: 'low'
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  };

  const suggestions = generateSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <Badge variant={getPriorityBadge(suggestion.priority)} className="text-xs">
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.description}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => navigate(suggestion.actionPath)}
                        className="text-xs"
                      >
                        {suggestion.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
