
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
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
  const [isCompact, setIsCompact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [session.messages, isThinking, isAnalyzing]);

  // Poll for session updates when analyzing
  useEffect(() => {
    if (session.status !== 'analyzing' || isAnalyzing) return;

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
    const timeout = setTimeout(() => {
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

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [session.status, session.id, isAnalyzing, onSessionUpdate, toast]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    console.log('Sending message:', content);

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToTargets}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chats
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {target.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                    Chat with {target.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {session.status.replace('_', ' ')} • {session.messages.length} messages
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(!isCompact)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {session.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto ${isCompact ? 'px-2 py-2' : 'px-4 py-6'} scroll-smooth`}
        style={{ 
          maxHeight: isCompact ? 'calc(100vh - 160px)' : 'calc(100vh - 200px)',
          minHeight: '400px'
        }}
      >
        <div className={`max-w-4xl mx-auto space-y-${isCompact ? '2' : '4'}`}>
          {session.messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Start your coaching session
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Tell me about your situation with {target.name} and what you'd like to achieve in this relationship.
              </p>
            </div>
          )}

          {session.messages.map((message, index) => (
            <div key={message.id} className="animate-fade-in">
              {message.sender === 'ai' ? (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:shadow-md">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-4">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-3xl flex justify-end">
                    <div>
                      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl rounded-tr-md px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md">
                        <p className="text-white leading-relaxed">{message.content}</p>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 mr-4 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
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
            <div className="flex items-start space-x-3 animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 max-w-3xl">
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <ThinkingAnimation />
                  {isAnalyzing && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
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

      {/* Input Area */}
      {session.status === 'gathering_info' && !isThinking && !isAnalyzing && (
        <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <form onSubmit={handleInputSubmit} className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share more about your situation..."
                className="flex-1 h-11 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 focus:ring-2 dark:bg-slate-800 dark:text-slate-200 rounded-xl transition-all duration-200"
                disabled={isThinking || isAnalyzing}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isThinking || isAnalyzing}
                className="h-11 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
