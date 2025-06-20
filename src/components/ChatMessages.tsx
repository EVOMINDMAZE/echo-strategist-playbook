
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
  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return new Date().toLocaleTimeString();
      }
      return date.toLocaleTimeString();
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
          <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-slate-800/60 backdrop-blur-sm text-slate-100 shadow-lg border border-slate-700/50">
            <div className="prose prose-sm max-w-none">
              <p className="mb-2 text-sm text-slate-100 leading-relaxed">
                Hi there! I'm here to help you navigate your relationship with this person. 
                Feel free to share what's on your mind - whether it's a specific situation, 
                ongoing challenges, or something you'd like advice on.
              </p>
              <p className="mb-0 text-sm text-slate-300 leading-relaxed">
                What would you like to talk about today?
              </p>
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600/30">
              <span className="text-xs opacity-70">
                {formatTimestamp(new Date().toISOString())}
              </span>
              <div className="flex items-center space-x-1 text-xs opacity-70">
                <Lock className="w-3 h-3" />
                <span>AI Response</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        // Skip messages with invalid content
        if (!message.content || !message.timestamp) {
          console.warn('Skipping invalid message:', message);
          return null;
        }

        return (
          <div
            key={message.id || `msg-${index}`}
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
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm text-inherit leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm text-inherit">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm text-inherit">{children}</ol>,
                    li: ({ children }) => <li className="mb-1 text-sm text-inherit">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-inherit">{children}</strong>,
                    code: ({ children }) => (
                      <code className="bg-slate-700/50 px-1 py-0.5 rounded text-xs text-inherit">{children}</code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600/30">
                <span className="text-xs opacity-70">
                  {formatTimestamp(message.timestamp)}
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
        );
      })}

      {/* Inline Strategist Prompt - shows after a few messages */}
      {sessionStatus === 'gathering_info' && onStrategistTrigger && messages.length >= 4 && (
        <InlineStrategistPrompt
          onTrigger={onStrategistTrigger}
          messageCount={messages.length}
          isAnalyzing={isLoading}
        />
      )}

      {/* Smart Reply Suggestions - Now with real database integration */}
      {messages.length > 0 && messages[messages.length - 1]?.sender === 'ai' && !isLoading && (
        <SmartReplySuggestions
          sessionId={sessionId}
          targetId={targetId}
          messages={messages}
          onSuggestionClick={onSuggestionClick}
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
    </>
  );
};
