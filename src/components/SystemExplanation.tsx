
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageSquare, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface SystemExplanationProps {
  onDismiss?: () => void;
  isVisible: boolean;
}

export const SystemExplanation = ({ onDismiss, isVisible }: SystemExplanationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700 shadow-sm animate-fade-in mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-purple-800 dark:text-purple-200 flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            How Your AI Coach Works
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                  Phase 1: Information Gathering
                </h4>
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                  Current
                </Badge>
              </div>
              <p className="text-purple-700 dark:text-purple-200 text-sm">
                I'll ask questions and gather context about your situation to understand the full picture.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                  Phase 2: Strategic Analysis
                </h4>
                <Badge variant="outline" className="text-xs border-pink-300 text-pink-600">
                  Next
                </Badge>
              </div>
              <p className="text-purple-700 dark:text-purple-200 text-sm">
                I'll analyze everything and create a personalized strategy with actionable recommendations.
              </p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="animate-fade-in pt-4 border-t border-purple-200 dark:border-purple-700">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowRight className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                  What makes this effective:
                </span>
              </div>
              <ul className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                <li>• Personalized approach based on your specific situation</li>
                <li>• Evidence-based coaching strategies</li>
                <li>• Actionable steps you can implement immediately</li>
                <li>• Continuous learning from your feedback</li>
              </ul>
            </div>
          </div>
        )}

        {onDismiss && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50"
            >
              Got it, thanks!
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
