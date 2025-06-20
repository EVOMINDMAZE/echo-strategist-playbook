
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
      console.log('Sending message to handle-user-message function');
      
      const response = await supabase.functions.invoke('handle-user-message', {
        body: {
          sessionId: session.id,
          message: message,
          previousMessages: session.messages,
          userMessageCount: session.messages.filter(m => m.sender === 'user').length + 1
        }
      });

      console.log('Response from handle-user-message:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw response.error;
      }

      const { data } = response;
      
      if (data && data.message) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content: data.message,
          sender: 'ai',
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        const finalSession = { ...session, messages: finalMessages };
        onSessionUpdate(finalSession);
        
        console.log('AI message added successfully');
      } else {
        console.error('No message in response data:', data);
        throw new Error('No AI response received');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the user message if AI response failed
      onSessionUpdate(session);
    }
  };

  return { handleSendMessage };
};
