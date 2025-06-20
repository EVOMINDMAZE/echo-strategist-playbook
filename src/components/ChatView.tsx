
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatViewHeader } from '@/components/ChatViewHeader';
import { ChatInputArea } from '@/components/ChatInputArea';
import { ChatMessages } from '@/components/ChatMessages';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import { InformativeMessages } from '@/components/InformativeMessages';
import { useChatMessageHandler } from '@/components/ChatMessageHandler';
import { SessionData, Client } from '@/hooks/useSupabaseCoaching';

interface ChatViewProps {
  session: SessionData;
  client: Client;
  onSessionUpdate: (session: SessionData) => void;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  isGeneratingStrategy?: boolean;
  previousSessions?: SessionData[];
  dismissedMessages?: string[];
  handleStrategistTrigger?: () => void;
  handleDismissMessage?: (messageType: string) => void;
  setPreviousSessions?: (sessions: SessionData[]) => void;
}

const ChatView = ({ 
  session, 
  client, 
  onSessionUpdate,
  messagesEndRef,
  isGeneratingStrategy = false,
  previousSessions = [],
  dismissedMessages = [],
  handleStrategistTrigger = () => {},
  handleDismissMessage = () => {},
  setPreviousSessions = () => {}
}: ChatViewProps) => {
  const navigate = useNavigate();
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const activeMessagesEndRef = messagesEndRef || internalMessagesEndRef;

  const { handleSendMessage } = useChatMessageHandler({
    session,
    client,
    onSessionUpdate
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
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
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
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

              <div ref={activeMessagesEndRef} />
            </div>

            <div className="flex-shrink-0">
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
    </div>
  );
};

export default ChatView;
