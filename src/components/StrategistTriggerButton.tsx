
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

interface StrategistTriggerButtonProps {
  onTrigger: () => void;
  messageCount: number;
  isAnalyzing: boolean;
  sessionStatus?: string;
}

export const StrategistTriggerButton = ({ 
  onTrigger, 
  messageCount, 
  isAnalyzing,
  sessionStatus = 'gathering_info'
}: StrategistTriggerButtonProps) => {
  // Show button if we have enough messages, not analyzing, and status allows analysis
  const shouldShow = messageCount >= 3 && 
                    !isAnalyzing && 
                    (sessionStatus === 'gathering_info' || sessionStatus ===  'active');

  if (!shouldShow) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 shadow-lg animate-fade-in my-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-200 mb-2">
                Ready for Strategic Analysis?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                I'll analyze your conversation and create a personalized strategy with specific actionable suggestions tailored to your situation.
              </p>
            </div>
          </div>
          <Button
            onClick={onTrigger}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 ml-4"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Get Analysis Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
