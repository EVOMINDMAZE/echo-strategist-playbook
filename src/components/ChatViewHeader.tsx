
import { ArrowLeft, Sparkles, Users, MessageSquare, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { ChatMessage } from '@/types/coaching';

interface ChatViewHeaderProps {
  session: SessionData;
  target: Client;
  previousSessions?: SessionData[];
  messages: ChatMessage[];
  isGeneratingStrategy?: boolean;
  onBackToTargets: () => void;
  onStrategistTrigger?: () => void;
}

export const ChatViewHeader = ({
  session,
  target,
  previousSessions = [],
  messages,
  isGeneratingStrategy = false,
  onBackToTargets,
  onStrategistTrigger = () => {}
}: ChatViewHeaderProps) => {
  const handleStrategistClick = () => {
    console.log('=== ChatViewHeader: Strategist button clicked ===');
    console.log('Messages count:', messages.length);
    console.log('Is generating strategy:', isGeneratingStrategy);
    console.log('Session status:', session.status);
    console.log('Calling onStrategistTrigger...');
    
    onStrategistTrigger();
  };

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Back button and target info */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">{target.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {messages.length} messages
                  </span>
                  {previousSessions.length > 0 && (
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {previousSessions.length} previous sessions
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
              <Clock className="w-3 h-3 mr-1" />
              {session.status === 'gathering_info' ? 'Active' : 
               session.status === 'analyzing' ? 'Analyzing' : 
               session.status === 'complete' ? 'Complete' : 'Unknown'}
            </Badge>
            
            {session.status === 'gathering_info' && messages.length >= 4 && (
              <Button
                onClick={handleStrategistClick}
                disabled={isGeneratingStrategy}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                size="sm"
              >
                {isGeneratingStrategy ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Strategic Analysis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
