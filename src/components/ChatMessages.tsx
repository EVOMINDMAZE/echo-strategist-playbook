
import { Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SmartReplySuggestions } from '@/components/SmartReplySuggestions';
import { ThinkingAnimation } from '@/components/ThinkingAnimation';
import type { ChatMessage } from '@/types/coaching';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatMessages = ({ messages, isLoading, onSuggestionClick }: ChatMessagesProps) => {
  return (
    <>
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
