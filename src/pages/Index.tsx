
import { useState, useEffect } from 'react';
import { TargetSelection } from '@/components/TargetSelection';
import { ChatView } from '@/components/ChatView';
import { PaywallModal } from '@/components/PaywallModal';
import { ResultsView } from '@/components/ResultsView';

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
  timestamp: Date;
  options?: string[];
}

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  case_file: any;
  strategist_output: any;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'target-selection' | 'chat' | 'results'>('target-selection');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Mock data for development - replace with Supabase calls
  const [targets, setTargets] = useState<Target[]>([
    { id: '1', name: 'Sarah', created_at: '2024-01-15' },
    { id: '2', name: 'Alex', created_at: '2024-01-20' }
  ]);

  const handleTargetSelect = (target: Target) => {
    setSelectedTarget(target);
    // Create new session for this target
    const newSession: SessionData = {
      id: Math.random().toString(36).substr(2, 9),
      target_id: target.id,
      status: 'gathering_info',
      messages: [{
        id: '1',
        content: `Hi! I'm Echo, your personal communication strategist. I see we're talking about ${target.name} today. How did our last strategy work out for you?`,
        sender: 'ai',
        timestamp: new Date(),
        options: [
          "It went really well!",
          "It was okay, mixed results",
          "It didn't work as expected",
          "This is our first session"
        ]
      }],
      case_file: {},
      strategist_output: null
    };
    setCurrentSession(newSession);
    setCurrentView('chat');
  };

  const handleNewTarget = (name: string) => {
    const newTarget: Target = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      created_at: new Date().toISOString()
    };
    setTargets([...targets, newTarget]);
    handleTargetSelect(newTarget);
  };

  const handleSessionStatusChange = (status: SessionStatus) => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status });
      if (status === 'analyzing') {
        setShowPaywall(true);
      } else if (status === 'complete') {
        setShowPaywall(false);
        setCurrentView('results');
      }
    }
  };

  const handlePaymentComplete = () => {
    setShowPaywall(false);
    // Simulate strategist completion
    setTimeout(() => {
      if (currentSession) {
        const mockResults = {
          analysis: "Based on your conversation history and current situation, I can see that the relationship is at a crucial transition point. The formal tone suggests they're being cautious, but their continued engagement indicates genuine interest.",
          suggestions: [
            {
              title: "Break the Ice with Shared Experience",
              description: "Reference something you both experienced or discussed previously to create instant connection.",
              why_it_works: "Shared experiences create psychological bonding and move conversations from formal to personal naturally."
            },
            {
              title: "Use Strategic Vulnerability",
              description: "Share something mildly personal about yourself to invite them to reciprocate.",
              why_it_works: "Controlled vulnerability builds trust and encourages deeper emotional connection."
            },
            {
              title: "Ask for Their Opinion",
              description: "Ask for their thoughts on something you're genuinely curious about.",
              why_it_works: "People love being valued for their insights, and it shifts focus from small talk to meaningful exchange."
            }
          ]
        };
        
        setCurrentSession({
          ...currentSession,
          status: 'complete',
          strategist_output: mockResults
        });
        setCurrentView('results');
      }
    }, 2000);
  };

  const handleBackToTargets = () => {
    setCurrentView('target-selection');
    setSelectedTarget(null);
    setCurrentSession(null);
    setShowPaywall(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {currentView === 'target-selection' && (
        <TargetSelection 
          targets={targets}
          onTargetSelect={handleTargetSelect}
          onNewTarget={handleNewTarget}
        />
      )}
      
      {currentView === 'chat' && currentSession && selectedTarget && (
        <ChatView 
          session={currentSession}
          target={selectedTarget}
          onSessionUpdate={setCurrentSession}
          onStatusChange={handleSessionStatusChange}
          onBackToTargets={handleBackToTargets}
        />
      )}
      
      {currentView === 'results' && currentSession && selectedTarget && (
        <ResultsView 
          session={currentSession}
          target={selectedTarget}
          onBackToTargets={handleBackToTargets}
          onNewSession={() => handleTargetSelect(selectedTarget)}
        />
      )}

      <PaywallModal 
        isOpen={showPaywall}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default Index;
