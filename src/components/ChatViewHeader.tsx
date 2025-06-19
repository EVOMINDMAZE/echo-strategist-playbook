
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StrategistTriggerButton } from '@/components/StrategistTriggerButton';
import {
  ArrowLeft,
  Shield,
  User
} from 'lucide-react';
import type { SessionData, Client, ChatMessage } from '@/types/coaching';

interface ChatViewHeaderProps {
  session: SessionData;
  target: Client;
  previousSessions: SessionData[];
  messages: ChatMessage[];
  isGeneratingStrategy: boolean;
  onBackToTargets: () => void;
  onStrategistTrigger: () => void;
}

export const ChatViewHeader = ({ 
  session, 
  target, 
  previousSessions, 
  messages, 
  isGeneratingStrategy, 
  onBackToTargets, 
  onStrategistTrigger 
}: ChatViewHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gathering_info':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-yellow-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
            <div className="h-6 w-px bg-slate-600"></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">{target.name}</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`}></div>
                  <span className="text-sm text-slate-400 capitalize">
                    {session.status.replace('_', ' ')}
                  </span>
                  {previousSessions.length > 0 && (
                    <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                      {previousSessions.length} previous session{previousSessions.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              <Shield className="w-3 h-3 mr-1" />
              Secure & Private
            </Badge>
            {session.status === 'gathering_info' && messages.length >= 3 && (
              <StrategistTriggerButton
                onTrigger={onStrategistTrigger}
                messageCount={messages.length}
                isAnalyzing={isGeneratingStrategy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
