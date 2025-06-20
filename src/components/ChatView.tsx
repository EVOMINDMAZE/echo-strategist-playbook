
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ChatViewHeader } from '@/components/ChatViewHeader';
import { ChatInputArea } from '@/components/ChatInputArea';
import { ChatMessages } from '@/components/ChatMessages';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import { InformativeMessages } from '@/components/InformativeMessages';
import { useChatMessageHandler } from '@/components/ChatMessageHandler';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { SessionStatus } from '@/types/coaching';

interface ChatViewProps {
  session: SessionData;
  client: Client;
  onSessionUpdate: (session: SessionData) => void;
}

const ChatView = ({ session, client, onSessionUpdate }: ChatViewProps) => {
  const navigate = useNavigate();
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleStatusChange = (status: SessionStatus) => {
    const updatedSession = { ...session, status };
    onSessionUpdate(updatedSession);
  };

  const handleDismissMessage = (messageType: string) => {
    setDismissedMessages(prev => [...prev, messageType]);
  };

  const handleStrategistTrigger = async () => {
    if (!session || !client) return;
    
    setIsGeneratingStrategy(true);
    handleStatusChange('analyzing');

    try {
      const response = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: session.id,
          targetName: client.name,
          chatHistory: session.messages
        }
      });

      if (response.error) throw response.error;

      const updatedSession = {
        ...session,
        status: 'complete' as SessionStatus,
        strategist_output: response.data.strategist_output
      };

      onSessionUpdate(updatedSession);
      handleStatusChange('complete');
      toast.success('Analysis complete! Check out your personalized strategies.');
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Failed to generate strategy. Please try again.');
      handleStatusChange('gathering_info');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const { handleSendMessage } = useChatMessageHandler({
    session,
    client,
    onSessionUpdate
  });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ChatViewHeader
        session={session}
        target={client}
        previousSessions={previousSessions}
        messages={session.messages}
        isGeneratingStrategy={isGeneratingStrategy}
        onBackToTargets={() => navigate('/clients')}
        onStrategistTrigger={handleStrategistTrigger}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              <SessionHistoryLoader
                targetId={session.target_id}
                currentSessionId={session.id}
                onHistoryLoaded={setPreviousSessions}
              />

              {session.messages.length === 0 && previousSessions.length > 0 && (
                <SessionContinuityHandler
                  previousSessions={previousSessions}
                  onFollowUpSelect={handleSendMessage}
                />
              )}

              {session.messages.length === 0 && previousSessions.length === 0 && (
                <InformativeMessages 
                  messageCount={session.messages.length}
                  onDismiss={handleDismissMessage}
                  dismissedMessages={dismissedMessages}
                />
              )}

              <ChatMessages
                sessionId={session.id}
                targetId={session.target_id}
                messages={session.messages}
                isLoading={isGeneratingStrategy}
                onSuggestionClick={handleSendMessage}
                onStrategistTrigger={handleStrategistTrigger}
                sessionStatus={session.status}
              />

              <div ref={messagesEndRef} />
            </div>

            <ChatInputArea
              session={session}
              previousSessions={previousSessions}
              messages={session.messages}
              isLoading={isGeneratingStrategy}
              onSubmit={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
