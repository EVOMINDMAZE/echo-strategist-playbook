
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Shield
} from 'lucide-react';
import type { SessionData } from '@/types/coaching';

interface ChatInputAreaProps {
  session: SessionData;
  previousSessions: SessionData[];
  messages: any[];
  isLoading: boolean;
  onSubmit: (messageText?: string) => void;
}

export const ChatInputArea = ({ 
  session, 
  previousSessions, 
  messages, 
  isLoading, 
  onSubmit 
}: ChatInputAreaProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;
    
    onSubmit(textToSend);
    if (!messageText) setInput(''); // Only clear input if not using preset message
  };

  const getPlaceholderText = () => {
    if (previousSessions.length > 0 && messages.length === 0) {
      return "Continue the conversation or click a suggestion above...";
    }
    if (messages.length === 0) {
      return "Share what's on your mind about this person or situation...";
    }
    return "Continue sharing your thoughts and feelings...";
  };

  return (
    <div className="border-t border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex space-x-4">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholderText()}
              className="min-h-[60px] max-h-32 resize-none bg-white border-2 border-slate-200 text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm leading-relaxed p-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2 text-xs text-slate-500">
              <Shield className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-3 text-xs text-slate-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
