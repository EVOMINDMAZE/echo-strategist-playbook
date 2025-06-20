
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCoaching, SessionData, Client } from '@/hooks/useSupabaseCoaching';
import { SessionStatus } from '@/types/coaching';

interface ChatStateManagerProps {
  session: SessionData | null;
  client: Client | null;
  onSessionUpdate: (session: SessionData) => void;
  onStatusChange: (status: SessionStatus) => void;
  children: (props: {
    isGeneratingStrategy: boolean;
    previousSessions: SessionData[];
    dismissedMessages: string[];
    handleStrategistTrigger: () => void;
    handleDismissMessage: (messageType: string) => void;
    setPreviousSessions: (sessions: SessionData[]) => void;
  }) => React.ReactNode;
}

export const ChatStateManager = ({ 
  session, 
  client, 
  onSessionUpdate, 
  onStatusChange, 
  children 
}: ChatStateManagerProps) => {
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  
  const { updateSession } = useSupabaseCoaching();

  const handleStrategistTrigger = useCallback(async () => {
    if (!session || !client) return;
    
    setIsGeneratingStrategy(true);
    onStatusChange('analyzing');

    try {
      const response = await supabase.functions.invoke('trigger-strategist', {
        body: {
          sessionId: session.id,
          targetName: client.name,
          chatHistory: session.messages
        }
      });

      if (response.error) throw response.error;

      const updatedSession = {
        ...session,
        status: 'complete' as SessionStatus,
        strategist_output: response.data.strategist_output
      };

      onSessionUpdate(updatedSession);
      onStatusChange('complete');
      toast.success('Analysis complete! Check out your personalized strategies.');
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Failed to generate strategy. Please try again.');
      onStatusChange('gathering_info');
    } finally {
      setIsGeneratingStrategy(false);
    }
  }, [session, client, onSessionUpdate, onStatusChange]);

  const handleDismissMessage = useCallback((messageType: string) => {
    setDismissedMessages(prev => [...prev, messageType]);
  }, []);

  return (
    <>
      {children({
        isGeneratingStrategy,
        previousSessions,
        dismissedMessages,
        handleStrategistTrigger,
        handleDismissMessage,
        setPreviousSessions
      })}
    </>
  );
};
