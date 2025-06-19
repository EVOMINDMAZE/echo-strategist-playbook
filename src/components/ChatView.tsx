
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InformativeMessages } from '@/components/InformativeMessages';
import { PrivacyWarning } from '@/components/PrivacyWarning';
import { SystemExplanation } from '@/components/SystemExplanation';
import { ResultsView } from '@/components/ResultsView';
import { SmartReplySuggestions } from '@/components/SmartReplySuggestions';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
import { StrategistTriggerButton } from '@/components/StrategistTriggerButton';
import { FollowUpPrompter } from '@/components/FollowUpPrompter';
import { SessionHistoryLoader } from '@/components/SessionHistoryLoader';
import { SessionContinuityHandler } from '@/components/SessionContinuityHandler';
import {
  ArrowLeft,
  Send,
  Shield,
  User,
  Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const [input, setInput] = useState('');
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
    const textToSend = messageText || input;
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
    if (!messageText) setInput(''); // Only clear input if not using preset message

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

  const handleFollowUpSelect = (question: string, context: any) => {
    console.log('Follow-up selected:', question, context);
    setInput(question);
    // Automatically send the follow-up question
    handleSubmit(question);
  };

  const handleSessionHistoryLoaded = (sessions: SessionData[]) => {
    setPreviousSessions(sessions);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-800">
      {/* Enhanced Header with secret room styling */}
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
                  onTrigger={handleStrategistTrigger}
                  messageCount={messages.length}
                  isAnalyzing={isGeneratingStrategy}
                />
              )}
            </div>
          </div>
        </div>
      </div>

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

            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'bg-slate-800/60 backdrop-blur-sm text-slate-100 shadow-lg border border-slate-700/50'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-inherit">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-inherit">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-inherit">{children}</ol>,
                        li: ({ children }) => <li className="mb-1 text-inherit">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-inherit">{children}</strong>,
                        code: ({ children }) => (
                          <code className="bg-slate-700/50 px-1 py-0.5 rounded text-sm text-inherit">{children}</code>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600/30">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.sender === 'ai' && (
                      <div className="flex items-center space-x-1 text-xs opacity-70">
                        <Lock className="w-3 h-3" />
                        <span>AI Response</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Smart Reply Suggestions */}
            {messages.length > 0 && messages[messages.length - 1]?.sender === 'ai' && (
              <SmartReplySuggestions
                messageCount={messages.length}
                lastAiMessage={messages[messages.length - 1]?.content || ''}
                onSuggestionClick={(suggestion) => {
                  setInput(suggestion);
                }}
                onDismiss={() => {}}
                isVisible={true}
              />
            )}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-700/50">
                  <ThinkingAnimation />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-xl">
            <div className="px-4 py-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      previousSessions.length > 0 && messages.length === 0
                        ? "Continue the conversation or click a follow-up question above..."
                        : "Share your thoughts, feelings, and situation details..."
                    }
                    className="min-h-[60px] max-h-32 resize-none bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-xs text-slate-500">
                    <Shield className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
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
