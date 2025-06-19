
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Client, SessionData, ChatMessage, SessionStatus } from '@/types/coaching';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
import { ResultsView } from '@/components/ResultsView';
import { StrategistTriggerButton } from '@/components/StrategistTriggerButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Fixed scrolling logic - only scroll when new messages are added or on initial load
  useEffect(() => {
    if (!hasScrolledToBottom && session.messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
        setHasScrolledToBottom(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session.messages.length, hasScrolledToBottom]);

  // Scroll when thinking state changes (new message being processed)
  useEffect(() => {
    if (isThinking || isAnalyzing) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isThinking, isAnalyzing]);

  // Poll for session updates when analyzing
  useEffect(() => {
    if (session.status === 'analyzing' && !isAnalyzing) {
      setIsAnalyzing(true);
      
      const pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('coaching_sessions')
            .select('*')
            .eq('id', session.id)
            .single();

          if (error) throw error;

          if (data.status === 'complete' && data.strategist_output) {
            console.log('Analysis complete!');
            const updatedSession = {
              ...session,
              status: data.status as SessionStatus,
              strategist_output: data.strategist_output as {
                analysis?: string;
                suggestions?: Array<{
                  title: string;
                  description: string;
                  why_it_works: string;
                }>;
              }
            };
            onSessionUpdate(updatedSession);
            setIsAnalyzing(false);
            clearInterval(pollInterval);
          } else if (data.status === 'error') {
            setIsAnalyzing(false);
            clearInterval(pollInterval);
            toast({
              title: "Analysis Error",
              description: "There was an error analyzing your conversation. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error polling session:', error);
        }
      }, 2000);

      // Cleanup interval after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isAnalyzing) {
          setIsAnalyzing(false);
          toast({
            title: "Analysis Timeout",
            description: "Analysis is taking longer than expected. Please try again.",
            variant: "destructive"
          });
        }
      }, 30000);

      return () => clearInterval(pollInterval);
    }
  }, [session.status, session.id, isAnalyzing, onSessionUpdate, toast]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    console.log('Sending message:', content);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage]
    };
    onSessionUpdate(updatedSession);
    setInputMessage('');
    setIsThinking(true);
    setHasScrolledToBottom(false);

    try {
      console.log('Calling handle-user-message function...');
      
      const { data, error } = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: content.trim(),
          targetName: target.name
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Edge function response:', data);

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, data.message]
      };

      onSessionUpdate(finalSession);
      setIsThinking(false);
      setHasScrolledToBottom(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsThinking(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleManualStrategistTrigger = async () => {
    console.log('Manual strategist trigger activated');
    
    onStatusChange('analyzing');
    setIsAnalyzing(true);
    
    try {
      const { error } = await supabase.functions.invoke('trigger-strategist', {
        body: { sessionId: session.id }
      });

      if (error) {
        console.error('Strategist error:', error);
        setIsAnalyzing(false);
        toast({
          title: "Analysis Error",
          description: "Failed to start analysis. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error calling trigger-strategist:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Error", 
        description: "Failed to start analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleContinueSession = () => {
    // Reset session status to continue gathering info
    const continuedSession = {
      ...session,
      status: 'gathering_info' as SessionStatus,
      is_continued: true
    };
    onSessionUpdate(continuedSession);
    onStatusChange('gathering_info');
  };

  const handleNewSession = () => {
    window.location.href = `/chats`;
  };

  const userMessageCount = session.messages.filter(msg => msg.sender === 'user').length;

  // Show results view if session is complete
  if (session.status === 'complete' && session.strategist_output) {
    return (
      <ResultsView
        session={session}
        client={target}
        onBackToClients={onBackToTargets}
        onNewSession={handleNewSession}
        onContinueSession={handleContinueSession}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 p-4 shadow-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chats
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {target.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chat with {target.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status: {session.status.replace('_', ' ')} • {session.messages.length} messages
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Session ID: {session.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed height with proper scrolling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 140px)' }}
      >
        <div className="p-3 pb-6">
          <div className="max-w-4xl mx-auto space-y-3">
            {session.messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Start your chat</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Tell me about your situation with {target.name} and what you'd like to achieve.</p>
              </div>
            )}

            {session.messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                {message.sender === 'ai' ? (
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50 max-w-2xl">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-2xl">
                        <p className="text-white leading-relaxed text-sm">{message.content}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Manual Strategist Trigger Button */}
            <StrategistTriggerButton
              onTrigger={handleManualStrategistTrigger}
              messageCount={userMessageCount}
              isAnalyzing={isAnalyzing}
            />

            {/* Thinking Animation */}
            {(isThinking || isAnalyzing) && (
              <div className="flex items-start space-x-2 animate-fade-in">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50 max-w-2xl">
                    <ThinkingAnimation />
                    {isAnalyzing && (
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                        Analyzing your conversation to create a personalized strategy...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      {session.status === 'gathering_info' && !isThinking && !isAnalyzing && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50 p-3 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleInputSubmit} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share more about your situation..."
                className="flex-1 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-200"
                disabled={isThinking || isAnalyzing}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isThinking || isAnalyzing}
                className="h-9 px-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-sm"
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
