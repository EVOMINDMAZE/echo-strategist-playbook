
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Client, SessionData, ChatMessage, SessionStatus } from '@/types/coaching';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
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
  }, [session.messages, isThinking]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

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
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: content.trim(),
          targetName: target.name
        }
      });

      if (error) throw error;

      // Add AI response to session
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, data.message]
      };

      onSessionUpdate(finalSession);
      setIsThinking(false);

      // Check if we should trigger analysis
      if (data.shouldTriggerAnalysis) {
        setTimeout(() => {
          onStatusChange('analyzing');
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

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

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
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <div className="p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {session.messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Start your coaching session</h3>
                <p className="text-slate-600">Begin the conversation with {target.name} to start gathering insights.</p>
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
                      {message.options && message.options.length > 0 && (
                        <div className="mt-4 space-y-2 max-w-2xl">
                          {message.options.map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              onClick={() => handleOptionClick(option)}
                              className="w-full justify-start text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}
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
            {isThinking && (
              <div className="flex items-start space-x-4 animate-fade-in">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-slate-200/50 max-w-2xl">
                    <ThinkingAnimation />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      {session.status === 'gathering_info' && !isThinking && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-slate-200/50 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleInputSubmit} className="flex space-x-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isThinking}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isThinking}
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
