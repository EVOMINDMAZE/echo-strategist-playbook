
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
import {
  ArrowLeft,
  Send,
  Shield,
  User,
  Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFollowUpTriggers } from '@/hooks/useFollowUpTriggers';
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
  const { triggers, markTriggered, dismissAll } = useFollowUpTriggers(target.id);

  useEffect(() => {
    setMessages(session.messages || []);
  }, [session.messages]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');

    // Optimistically update the UI
    onSessionUpdate({ ...session, messages: updatedMessages });

    try {
      // Simulate AI response (replace with actual API call)
      const aiResponse = await simulateAIResponse(input);
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      onSessionUpdate({ ...session, messages: finalMessages });
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Handle error (e.g., display error message)
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate a delay to mimic an API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `Thanks for sharing! Here's a simulated AI response to your message: "${userMessage}".`;
  };

  const handleStrategistTrigger = async () => {
    setIsGeneratingStrategy(true);
    onStatusChange('analyzing');

    // Simulate strategist output generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockStrategistOutput = {
      analysis: "Based on your conversation, here's a potential strategy:",
      suggestions: [
        { title: 'Try active listening', description: 'Focus on understanding their perspective.', why_it_works: 'Builds empathy' },
        { title: 'Set clear boundaries', description: 'Communicate your limits assertively.', why_it_works: 'Reduces conflict' },
      ],
    };

    onSessionUpdate({
      ...session,
      status: 'complete',
      strategist_output: mockStrategistOutput,
    });
    onStatusChange('complete');
    setIsGeneratingStrategy(false);
  };

  const handleDismissMessage = (messageType: string) => {
    setDismissedMessages([...dismissedMessages, messageType]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gathering_info':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-yellow-500 animate-pulse';
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
    // Optionally send immediately
    handleSubmit(new Event('submit') as any);
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
            {/* Show Follow-up Prompts at the top if available */}
            {triggers.length > 0 && (
              <FollowUpPrompter
                targetId={target.id}
                onQuestionSelect={handleFollowUpSelect}
                onDismissAll={dismissAll}
              />
            )}

            {/* Guidance Components */}
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
                lastAiMessage={messages[messages.length - 1]?.content || ''}
                onSuggestionSelect={(suggestion) => {
                  setInput(suggestion);
                }}
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
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Share your thoughts, feelings, and situation details..."
                    className="min-h-[60px] max-h-32 resize-none bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
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
          onFeedbackSubmit={(feedbackData) => {
            onSessionUpdate({
              ...session,
              feedback_data: feedbackData,
              feedback_submitted_at: new Date().toISOString()
            });
          }}
          onNewSession={() => {
            // Handle new session creation
            console.log('Creating new session...');
          }}
        />
      )}
    </div>
  );
};
