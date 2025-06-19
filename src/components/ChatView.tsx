
import React, { useState, useEffect } from 'react';
import { InformativeMessages } from '@/components/InformativeMessages';
import { PrivacyWarning } from '@/components/PrivacyWarning';
import { SystemExplanation } from '@/components/SystemExplanation';
import { ResultsView } from '@/components/ResultsView';
import { FollowUpPrompter } from '@/components/FollowUpPrompter';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import { ChatViewHeader } from '@/components/ChatViewHeader';
import { ChatInputArea } from '@/components/ChatInputArea';
import { ChatMessages } from '@/components/ChatMessages';
import { useFollowUpTriggers } from '@/hooks/useFollowUpTriggers';
import { supabase } from '@/integrations/supabase/client';
import type { SessionData, Client, ChatMessage } from '@/types/coaching';

interface ChatViewProps {
  session: SessionData;
  target: Client;
  onSessionUpdate: (updatedSession: SessionData) => void;
  onStatusChange: (status: string) => void;
  onBackToTargets: () => void;
}

export const ChatView = ({ session, target, onSessionUpdate, onStatusChange, onBackToTargets }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);
  const { triggers, markTriggered, dismissAll } = useFollowUpTriggers(target.id);

  useEffect(() => {
    setMessages(session.messages || []);
  }, [session.messages]);

  // Check if this is a continuing session and we should ask follow-up questions
  useEffect(() => {
    if (previousSessions.length > 0 && messages.length === 0 && !hasAskedFollowUp) {
      // This is a new session for a client with history, but no messages yet
      // We should show the follow-up questions
      setHasAskedFollowUp(true);
    }
  }, [previousSessions, messages, hasAskedFollowUp]);

  const handleSubmit = async (messageText?: string) => {
    const textToSend = messageText || '';
    if (!textToSend.trim()) return;

    setIsLoading(true);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Optimistically update the UI
    onSessionUpdate({ ...session, messages: updatedMessages });

    try {
      // Call the enhanced edge function that includes session history
      const { data, error } = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: textToSend,
          targetName: target.name,
          previousSessions: previousSessions.map(s => ({
            id: s.id,
            messages: s.messages,
            strategist_output: s.strategist_output,
            feedback_data: s.feedback_data,
            user_feedback: s.user_feedback,
            created_at: s.created_at
          }))
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.message.content,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      onSessionUpdate({ ...session, messages: finalMessages });
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      onSessionUpdate({ ...session, messages: finalMessages });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategistTrigger = async () => {
    setIsGeneratingStrategy(true);
    onStatusChange('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: session.id,
          targetName: target.name,
          chatHistory: messages,
          previousSessions: previousSessions
        }
      });

      if (error) throw error;

      onSessionUpdate({
        ...session,
        status: 'complete',
        strategist_output: data.strategist_output,
      });
      onStatusChange('complete');
    } catch (error) {
      console.error('Error generating strategy:', error);
      onStatusChange('error');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleDismissMessage = (messageType: string) => {
    setDismissedMessages([...dismissedMessages, messageType]);
  };

  const handleFollowUpSelect = (question: string, context: any) => {
    console.log('Follow-up selected:', question, context);
    handleSubmit(question);
  };

  const handleSessionHistoryLoaded = (sessions: SessionData[]) => {
    setPreviousSessions(sessions);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-800">
      {/* Enhanced Header */}
      <ChatViewHeader
        session={session}
        target={target}
        previousSessions={previousSessions}
        messages={messages}
        isGeneratingStrategy={isGeneratingStrategy}
        onBackToTargets={onBackToTargets}
        onStrategistTrigger={handleStrategistTrigger}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages Area with enhanced styling */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Load and display session history */}
            <SessionHistoryLoader
              targetId={target.id}
              currentSessionId={session.id}
              onHistoryLoaded={handleSessionHistoryLoaded}
            />

            {/* Show Follow-up Questions for Continuing Sessions */}
            {previousSessions.length > 0 && messages.length === 0 && (
              <SessionContinuityHandler
                previousSessions={previousSessions}
                onFollowUpSelect={handleFollowUpSelect}
              />
            )}

            {/* Show Follow-up Prompts at the top if available */}
            {triggers.length > 0 && (
              <FollowUpPrompter
                targetId={target.id}
                onQuestionSelect={handleFollowUpSelect}
                onDismissAll={dismissAll}
              />
            )}

            {/* Guidance Components - only show for new sessions */}
            {messages.length === 0 && previousSessions.length === 0 && (
              <>
                <SystemExplanation 
                  isVisible={!dismissedMessages.includes('system-explanation')} 
                  onDismiss={() => handleDismissMessage('system-explanation')} 
                />
                
                <InformativeMessages
                  messageCount={messages.length}
                  onDismiss={handleDismissMessage}
                  dismissedMessages={dismissedMessages}
                />
                
                <PrivacyWarning
                  isVisible={!dismissedMessages.includes('privacy-warning')}
                  onDismiss={() => handleDismissMessage('privacy-warning')}
                />
              </>
            )}

            {/* Chat Messages */}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          {/* Enhanced Input Area */}
          <ChatInputArea
            session={session}
            previousSessions={previousSessions}
            messages={messages}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Results View */}
      {session.status === 'complete' && session.strategist_output && (
        <ResultsView
          session={session}
          client={target}
          onBackToClients={onBackToTargets}
          onNewSession={() => {
            // Handle new session creation
            console.log('Creating new session...');
          }}
        />
      )}
    </div>
  );
};
