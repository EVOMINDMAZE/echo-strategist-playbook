
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Client, SessionData, ChatMessage, SessionStatus } from '@/types/coaching';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
import { ResultsView } from '@/components/ResultsView';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    // Always scroll to bottom when messages change or thinking state changes
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [session.messages, isThinking, isAnalyzing]);

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
      timestamp: new Date()
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
      
      // Call the Edge Function
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

      // Add AI response to session
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, data.message]
      };

      onSessionUpdate(finalSession);
      setIsThinking(false);

      // Check if we should trigger analysis
      if (data.shouldTriggerAnalysis) {
        console.log('Triggering strategist analysis...');
        
        setTimeout(async () => {
          onStatusChange('analyzing');
          
          try {
            const { error: strategistError } = await supabase.functions.invoke('trigger-strategist', {
              body: { sessionId: session.id }
            });

            if (strategistError) {
              console.error('Strategist error:', strategistError);
              toast({
                title: "Analysis Error",
                description: "Failed to start analysis. Please try again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error calling trigger-strategist:', error);
            toast({
              title: "Analysis Error", 
              description: "Failed to start analysis. Please try again.",
              variant: "destructive"
            });
          }
        }, 1000);
      }

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

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleNewSession = () => {
    // Navigate back to create a new session
    window.location.href = `/clients`;
  };

  // Show results view if session is complete
  if (session.status === 'complete' && session.strategist_output) {
    return (
      <ResultsView
        session={session}
        client={target}
        onBackToClients={onBackToTargets}
        onNewSession={handleNewSession}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/50 p-4 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {target.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">
                  Coaching session with {target.name}
                </h2>
                <p className="text-sm text-slate-500">
                  Status: {session.status.replace('_', ' ')} • {session.messages.length} messages
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Session ID: {session.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed height with proper scrolling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div className="p-4 pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {session.messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Start your coaching session</h3>
                <p className="text-slate-600">Tell me about your situation with {target.name} and what you'd like to achieve.</p>
              </div>
            )}

            {session.messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                {message.sender === 'ai' ? (
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-slate-200/50 max-w-2xl">
                        <p className="text-slate-700 leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-4 justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-2xl">
                        <p className="text-white leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Animation */}
            {(isThinking || isAnalyzing) && (
              <div className="flex items-start space-x-4 animate-fade-in">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-slate-200/50 max-w-2xl">
                    <ThinkingAnimation />
                    {isAnalyzing && (
                      <p className="text-slate-600 text-sm mt-2">
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
        <div className="bg-white/90 backdrop-blur-sm border-t border-slate-200/50 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleInputSubmit} className="flex space-x-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share more about your situation..."
                className="flex-1 h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isThinking || isAnalyzing}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isThinking || isAnalyzing}
                className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
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
