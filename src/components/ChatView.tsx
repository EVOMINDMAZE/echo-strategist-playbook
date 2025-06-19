import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ChatViewHeader } from '@/components/ChatViewHeader';
import { ChatInputArea } from '@/components/ChatInputArea';
import { ChatMessages } from '@/components/ChatMessages';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import { ResultsView } from '@/components/ResultsView';
import { InformativeMessages } from '@/components/InformativeMessages';
import type { SessionData, Client, ChatMessage, SessionStatus } from '@/types/coaching';

interface ChatViewProps {
  session: SessionData;
  target: Client;
  onSessionUpdate: (session: SessionData) => void;
  onStatusChange: (status: SessionStatus) => void;
  onBackToTargets: () => void;
}

export const ChatView = ({
  session,
  target,
  onSessionUpdate,
  onStatusChange,
  onBackToTargets
}: ChatViewProps) => {
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string, context?: any) => {
    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    const message = messageText || inputElement?.value || '';
    
    if (!message.trim()) return;

    if (!messageText && inputElement) {
      inputElement.value = '';
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...session.messages, userMessage];
    const updatedSession = { ...session, messages: updatedMessages };
    onSessionUpdate(updatedSession);

    try {
      const response = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: message,
          targetName: target.name
        }
      });

      if (response.error) throw response.error;

      const { message: aiMessage } = response.data;
      
      if (aiMessage) {
        const finalMessages = [...updatedMessages, aiMessage];
        const finalSession = { ...session, messages: finalMessages };
        onSessionUpdate(finalSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleStrategistTrigger = async () => {
    setIsGeneratingStrategy(true);
    onStatusChange('analyzing');

    try {
      const response = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: session.id,
          targetName: target.name,
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
      onStatusChange('complete');
      toast.success('Analysis complete! Check out your personalized strategies.');
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Failed to generate strategy. Please try again.');
      onStatusChange('gathering_info');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  if (session.status === 'complete' && session.strategist_output) {
    return (
      <ResultsView
        session={session}
        target={target}
        onBackToTargets={onBackToTargets}
        onStartNewSession={() => {
          // Reset session for new conversation
          const newSession = {
            ...session,
            status: 'gathering_info' as SessionStatus,
            messages: [],
            strategist_output: undefined
          };
          onSessionUpdate(newSession);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ChatViewHeader
        session={session}
        target={target}
        previousSessions={previousSessions}
        messages={session.messages}
        isGeneratingStrategy={isGeneratingStrategy}
        onBackToTargets={onBackToTargets}
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
                <InformativeMessages targetName={target.name} />
              )}

              <ChatMessages
                sessionId={session.id}
                targetId={session.target_id}
                messages={session.messages}
                isLoading={isGeneratingStrategy}
                onSuggestionClick={handleSendMessage}
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
