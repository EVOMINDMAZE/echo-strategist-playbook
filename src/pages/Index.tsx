
import { useState, useEffect } from 'react';
import { TargetSelection } from '@/components/TargetSelection';
import { ChatView } from '@/components/ChatView';
import { ResultsView } from '@/components/ResultsView';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';

export type SessionStatus = 'gathering_info' | 'analyzing' | 'complete' | 'error';

export interface Target {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date | string;
  options?: string[];
}

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  case_data: Record<string, any>;
  strategist_output?: {
    analysis?: string;
    suggestions?: Array<{
      title: string;
      description: string;
      why_it_works: string;
    }>;
  };
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'targets' | 'chat' | 'results'>('targets');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const { toast } = useToast();

  const {
    targets,
    loading,
    createTarget,
    createSession,
    sendMessage,
    triggerStrategist,
    getSession
  } = useSupabaseCoaching();

  const handleTargetSelect = async (target: Target) => {
    try {
      setSelectedTarget(target);
      const session = await createSession(target.id);
      setCurrentSession(session);
      setCurrentView('chat');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to start coaching session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNewTarget = async (name: string) => {
    try {
      const newTarget = await createTarget(name);
      await handleTargetSelect(newTarget);
    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: "Error", 
        description: "Failed to create new person. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSessionUpdate = async (session: SessionData) => {
    setCurrentSession(session);
  };

  const handleStatusChange = async (status: SessionStatus) => {
    if (!currentSession) return;

    if (status === 'analyzing') {
      try {
        await triggerStrategist(currentSession.id);
        
        // Poll for completion
        const pollForCompletion = async () => {
          try {
            const updatedSession = await getSession(currentSession.id);
            if (updatedSession.status === 'complete') {
              setCurrentSession(updatedSession);
              setCurrentView('results');
            } else if (updatedSession.status === 'error') {
              toast({
                title: "Error",
                description: "Failed to generate your playbook. Please try again.",
                variant: "destructive"
              });
            } else {
              // Continue polling
              setTimeout(pollForCompletion, 2000);
            }
          } catch (error) {
            console.error('Error polling session:', error);
            toast({
              title: "Error",
              description: "Failed to check session status. Please refresh the page.",
              variant: "destructive"
            });
          }
        };

        setTimeout(pollForCompletion, 3000);
      } catch (error) {
        console.error('Error triggering strategist:', error);
        toast({
          title: "Error",
          description: "Failed to analyze conversation. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleBackToTargets = () => {
    setCurrentView('targets');
    setSelectedTarget(null);
    setCurrentSession(null);
  };

  const handleNewSession = () => {
    if (selectedTarget) {
      handleTargetSelect(selectedTarget);
    } else {
      handleBackToTargets();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (currentView === 'targets') {
    return (
      <TargetSelection
        targets={targets}
        onTargetSelect={handleTargetSelect}
        onNewTarget={handleNewTarget}
      />
    );
  }

  if (currentView === 'chat' && currentSession && selectedTarget) {
    return (
      <ChatView
        session={currentSession}
        target={selectedTarget}
        onSessionUpdate={handleSessionUpdate}
        onStatusChange={handleStatusChange}
        onBackToTargets={handleBackToTargets}
      />
    );
  }

  if (currentView === 'results' && currentSession && selectedTarget) {
    return (
      <ResultsView
        session={currentSession}
        target={selectedTarget}
        onBackToTargets={handleBackToTargets}
        onNewSession={handleNewSession}
      />
    );
  }

  return null;
};

export default Index;
