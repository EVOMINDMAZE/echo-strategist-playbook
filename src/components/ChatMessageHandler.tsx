
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SessionData, Client, ChatMessage } from '@/types/coaching';

interface ChatMessageHandlerProps {
  session: SessionData;
  client: Client;
  onSessionUpdate: (session: SessionData) => void;
}

export const useChatMessageHandler = ({ 
  session, 
  client, 
  onSessionUpdate 
}: ChatMessageHandlerProps) => {
  const handleSendMessage = async (messageText?: string, context?: any) => {
    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    const message = messageText || inputElement?.value || '';
    
    if (!message.trim()) return;

    if (!messageText && inputElement) {
      inputElement.value = '';
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...session.messages, userMessage];
    const updatedSession = { ...session, messages: updatedMessages };
    onSessionUpdate(updatedSession);

    try {
      const response = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: message,
          targetName: client.name
        }
      });

      if (response.error) throw response.error;

      const { message: aiMessage } = response.data;
      
      if (aiMessage) {
        const finalMessages = [...updatedMessages, aiMessage];
        const finalSession = { ...session, messages: finalMessages };
        onSessionUpdate(finalSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return { handleSendMessage };
};
