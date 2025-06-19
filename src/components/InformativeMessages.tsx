
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Lightbulb, X, Target, MessageCircle } from 'lucide-react';

interface InformativeMessagesProps {
  messageCount: number;
  onDismiss?: (messageType: string) => void;
  dismissedMessages: string[];
}

export const InformativeMessages = ({ 
  messageCount, 
  onDismiss, 
  dismissedMessages 
}: InformativeMessagesProps) => {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    // Show different messages based on conversation progress
    if (messageCount === 1 && !dismissedMessages.includes('welcome')) {
      setCurrentMessage('welcome');
    } else if (messageCount === 3 && !dismissedMessages.includes('detail-tip')) {
      setCurrentMessage('detail-tip');
    } else if (messageCount === 6 && !dismissedMessages.includes('context-tip')) {
      setCurrentMessage('context-tip');
    } else {
      setCurrentMessage(null);
    }
  }, [messageCount, dismissedMessages]);

  const handleDismiss = () => {
    if (currentMessage && onDismiss) {
      onDismiss(currentMessage);
    }
    setCurrentMessage(null);
  };

  const messages = {
    welcome: {
      icon: MessageCircle,
      title: "Welcome to your coaching session!",
      content: "Share as much detail as you can about your situation. The more context you provide, the more personalized and effective your coaching strategy will be.",
      badge: "Tip"
    },
    'detail-tip': {
      icon: Target,
      title: "Pro tip for better results",
      content: "Include specific examples, emotions you're feeling, and what outcomes you're hoping for. This helps create more tailored strategies.",
      badge: "Enhanced Results"
    },
    'context-tip': {
      icon: Lightbulb,
      title: "Ready for strategic insights?",
      content: "Once you've shared enough context, use the 'Get Strategic Analysis' button to receive your personalized coaching playbook.",
      badge: "Next Step"
    }
  };

  if (!currentMessage || !messages[currentMessage as keyof typeof messages]) {
    return null;
  }

  const message = messages[currentMessage as keyof typeof messages];
  const IconComponent = message.icon;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 shadow-sm animate-fade-in mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                  {message.title}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {message.badge}
                </Badge>
              </div>
              <p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
