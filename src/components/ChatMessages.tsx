
import { Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SmartReplySuggestions } from '@/components/SmartReplySuggestions';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
import { InlineStrategistPrompt } from '@/components/InlineStrategistPrompt';
import type { ChatMessage } from '@/types/coaching';

interface ChatMessagesProps {
  sessionId: string;
  targetId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onStrategistTrigger?: () => void;
  sessionStatus?: string;
}

export const ChatMessages = ({ 
  sessionId, 
  targetId, 
  messages, 
  isLoading, 
  onSuggestionClick,
  onStrategistTrigger,
  sessionStatus = 'gathering_info'
}: ChatMessagesProps) => {
  // Helper function to format timestamp with better error handling
  const formatTimestamp = (timestamp: string) => {
    try {
      if (!timestamp || timestamp === 'Invalid Date') {
        return new Date().toLocaleTimeString();
      }
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp provided:', timestamp);
        return new Date().toLocaleTimeString();
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return new Date().toLocaleTimeString();
    }
  };

  return (
    <>
      {/* Welcome message if no messages */}
      {messages.length === 0 && !isLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-white border border-gray-200 shadow-sm">
            <div className="prose prose-sm max-w-none">
              <p className="mb-2 text-sm text-gray-800 leading-relaxed">
                Hi there! I'm here to help you navigate your relationship with this person. 
                Feel free to share what's on your mind - whether it's a specific situation, 
                ongoing challenges, or something you'd like advice on.
              </p>
              <p className="mb-0 text-sm text-gray-600 leading-relaxed">
                What would you like to talk about today?
              </p>
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {formatTimestamp(new Date().toISOString())}
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>AI Response</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        // Skip messages with invalid content but with better validation
        if (!message?.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
          console.warn('Skipping invalid message:', message);
          return null;
        }

        return (
          <div
            key={message.id || `msg-${index}`}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-6 py-4 break-words ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed break-words">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm">{children}</ol>,
                    li: ({ children }) => <li className="mb-1 text-sm break-words">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => (
                      <code className={`px-1 py-0.5 rounded text-xs break-words ${
                        message.sender === 'user' ? 'bg-blue-700 text-blue-100' : 'bg-gray-100 text-gray-800'
                      }`}>{children}</code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className={`flex justify-between items-center mt-3 pt-2 border-t ${
                message.sender === 'user' ? 'border-blue-500' : 'border-gray-200'
              }`}>
                <span className={`text-xs ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp || new Date().toISOString())}
                </span>
                {message.sender === 'ai' && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Lock className="w-3 h-3" />
                    <span>AI Response</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Inline Strategist Prompt - shows after a few messages */}
      {sessionStatus === 'gathering_info' && onStrategistTrigger && messages.length >= 4 && !isLoading && (
        <InlineStrategistPrompt
          onTrigger={onStrategistTrigger}
          messageCount={messages.length}
          isAnalyzing={isLoading}
        />
      )}

      {/* AI Thinking Animation - Enhanced positioning and visibility */}
      {isLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
            <ThinkingAnimation />
          </div>
        </div>
      )}

      {/* Smart Reply Suggestions - Only show when not loading and after AI response */}
      {!isLoading && messages.length > 0 && messages[messages.length - 1]?.sender === 'ai' && (
        <SmartReplySuggestions
          sessionId={sessionId}
          targetId={targetId}
          messages={messages}
          onSuggestionClick={onSuggestionClick}
          onDismiss={() => {}}
          isVisible={true}
        />
      )}
    </>
  );
};
