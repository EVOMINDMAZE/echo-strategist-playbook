
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface InlineStrategistPromptProps {
  onTrigger: () => void;
  messageCount: number;
  isAnalyzing: boolean;
  sessionStatus?: string;
}

export const InlineStrategistPrompt = ({ 
  onTrigger, 
  messageCount, 
  isAnalyzing,
  sessionStatus = 'gathering_info'
}: InlineStrategistPromptProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Show button if we have enough messages, not analyzing, not dismissed, and status allows re-analysis
  const shouldShow = messageCount >= 3 && 
                    !isAnalyzing && 
                    !isDismissed && 
                    (sessionStatus === 'gathering_info' || sessionStatus === 'active');

  if (!shouldShow) return null;

  const handleTriggerClick = () => {
    console.log('=== InlineStrategistPrompt: Analyze Now button clicked ===');
    console.log('Message count:', messageCount);
    console.log('Is analyzing:', isAnalyzing);
    console.log('Session status:', sessionStatus);
    console.log('Calling onTrigger function...');
    
    onTrigger();
  };

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30 shadow-lg animate-fade-in my-4 mx-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-200 text-sm mb-1">
                Ready for Strategic Analysis?
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Get personalized strategies based on your conversation
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTriggerClick}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs px-3 py-1.5 h-auto shadow-lg"
              size="sm"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Analyze Now
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
