
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Modern Header */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToTargets}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chats
              </Button>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/20">
                    {target.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                    {target.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {session.messages.length} messages • {session.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(!isCompact)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg"
              >
                {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                {session.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto custom-scrollbar ${isCompact ? 'px-4 py-3' : 'px-6 py-8'}`}
        style={{ 
          maxHeight: isCompact ? 'calc(100vh - 180px)' : 'calc(100vh - 220px)',
          minHeight: '400px'
        }}
      >
        <div className={`max-w-4xl mx-auto space-y-${isCompact ? '3' : '6'}`}>
          {session.messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl ring-4 ring-indigo-100 dark:ring-indigo-900/50">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Start your coaching session
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                Tell me about your situation with <span className="font-semibold text-indigo-600 dark:text-indigo-400">{target.name}</span> and what you'd like to achieve in this relationship.
              </p>
            </div>
          )}

          {session.messages.map((message, index) => (
            <div key={message.id} className="animate-fade-in">
              {message.sender === 'ai' ? (
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ring-2 ring-white/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-white dark:bg-slate-800/90 rounded-2xl rounded-tl-lg px-6 py-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-600/60">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">
                        {message.content}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 ml-6 flex items-center">
                      <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mr-2"></div>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4 justify-end">
                  <div className="flex-1 max-w-3xl flex justify-end">
                    <div>
                      <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 rounded-2xl rounded-tr-lg px-6 py-4 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                        <p className="text-white leading-relaxed text-[15px] font-medium">{message.content}</p>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 mr-6 text-right flex items-center justify-end">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full ml-2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
            <div className="flex items-start space-x-4 animate-fade-in">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ring-2 ring-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 max-w-3xl">
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl rounded-tl-lg px-6 py-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                  <ThinkingAnimation />
                  {isAnalyzing && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 flex items-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse mr-2"></div>
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

      {/* Modern Input Area */}
      {session.status === 'gathering_info' && !isThinking && !isAnalyzing && (
        <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-5">
            <form onSubmit={handleInputSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Share more about your situation..."
                  className="h-12 text-[15px] border-slate-300/60 dark:border-slate-600/60 focus:border-indigo-400 focus:ring-indigo-400/30 focus:ring-4 dark:bg-slate-800/90 dark:text-slate-200 rounded-xl pr-4 pl-4 shadow-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={isThinking || isAnalyzing}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
                  {inputMessage.length}/1000
                </div>
              </div>
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isThinking || isAnalyzing}
                className="h-12 px-6 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 hover:from-indigo-600 hover:via-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg font-medium"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
