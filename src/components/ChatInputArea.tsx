
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
    <div className="border-t border-border bg-card/60 backdrop-blur-xl">
      <div className="px-4 py-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex space-x-3">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholderText()}
              className="min-h-[60px] max-h-32 resize-none bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 rounded-xl text-sm leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
