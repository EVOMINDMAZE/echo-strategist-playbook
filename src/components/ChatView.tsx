
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Target, SessionData, ChatMessage, SessionStatus } from '@/pages/Index';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';

interface ChatViewProps {
  session: SessionData;
  target: Target;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        {
          content: "That's really helpful context. Now, what would you say is your main goal with this conversation?",
          options: [
            "Get a second date",
            "Keep the conversation flowing",
            "Build deeper connection",
            "Clarify where we stand"
          ]
        },
        {
          content: "Perfect! And how would you describe your personality when you're at your best?",
          options: [
            "Witty and playful",
            "Thoughtful and deep",
            "Adventurous and spontaneous",
            "Caring and supportive"
          ]
        },
        {
          content: "Excellent! That gives me a clear picture. Let me pass this to our strategist. This should only take a moment.",
          options: []
        }
      ];

      const responseIndex = Math.min(session.messages.length - 1, aiResponses.length - 1);
      const response = aiResponses[responseIndex];

      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        options: response.options.length > 0 ? response.options : undefined
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage]
      };

      onSessionUpdate(finalSession);
      setIsThinking(false);

      // Check if conversation is complete
      if (response.options.length === 0) {
        setTimeout(() => {
          onStatusChange('analyzing');
        }, 1000);
      }
    }, 2000);
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTargets}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {target.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">
                  Coaching session for {target.name}
                </h2>
                <p className="text-sm text-slate-500">
                  Status: {session.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Input */}
      {session.status === 'gathering_info' && !isThinking && (
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200/50 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleInputSubmit} className="flex space-x-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim()}
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
