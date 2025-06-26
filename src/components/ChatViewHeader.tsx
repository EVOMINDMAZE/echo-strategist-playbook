
import { ArrowLeft, Sparkles, Users, MessageSquare, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const getStatusBadge = () => {
    switch (session.status) {
      case 'gathering_info':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>;
      case 'analyzing':
        return <Badge variant="warning" className="bg-orange-100 text-orange-800 border-orange-200">Analyzing</Badge>;
      case 'complete':
        return <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Unknown</Badge>;
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Back button and target info */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{target.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {messages.length} messages
                  </span>
                  {previousSessions.length > 0 && (
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {previousSessions.length} previous sessions
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            {getStatusBadge()}
            
            {session.status === 'gathering_info' && messages.length >= 4 && (
              <Button
                onClick={handleStrategistClick}
                disabled={isGeneratingStrategy}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border-0"
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
