
import { useState, useEffect } from 'react';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { IntelligentOnboarding } from '@/components/IntelligentOnboarding';
import type { SessionData } from '@/types/coaching';

interface ChatOnboardingHandlerProps {
  sessionId: string;
  clientName: string;
  session: SessionData | null;
  onComplete: (data: any) => void;
  onSkip: () => void;
}

export const ChatOnboardingHandler = ({
  sessionId,
  clientName,
  session,
  onComplete,
  onSkip
}: ChatOnboardingHandlerProps) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { hasContext, loading: contextLoading } = useIntelligentOnboarding(sessionId);

  useEffect(() => {
    if (!contextLoading && hasContext === false && session && session.messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [contextLoading, hasContext, session]);

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    setShowOnboarding(false);
    onComplete(data);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    onSkip();
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <IntelligentOnboarding
      sessionId={sessionId}
      targetName={clientName}
      onComplete={handleOnboardingComplete}
      onSkip={handleOnboardingSkip}
    />
  );
};
