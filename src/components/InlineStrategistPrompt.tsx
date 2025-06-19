
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface InlineStrategistPromptProps {
  onTrigger: () => void;
  messageCount: number;
  isAnalyzing: boolean;
}

export const InlineStrategistPrompt = ({ 
  onTrigger, 
  messageCount, 
  isAnalyzing 
}: InlineStrategistPromptProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (messageCount < 3 || isAnalyzing || isDismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border-indigo-200/60 shadow-sm animate-fade-in my-3 mx-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 text-sm mb-1">
                Ready for Strategic Analysis?
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Get personalized strategies based on your conversation
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onTrigger}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs px-3 py-1.5 h-auto"
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
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
