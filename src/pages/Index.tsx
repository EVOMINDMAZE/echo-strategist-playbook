import { useState, useEffect } from 'react';
import { TargetSelection } from '@/components/TargetSelection';
import { ChatView } from '@/components/ChatView';
import { PaywallModal } from '@/components/PaywallModal';
import { ResultsView } from '@/components/ResultsView';
import { AuthModal } from '@/components/AuthModal';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Settings, Crown } from 'lucide-react';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentView, setCurrentView] = useState<'target-selection' | 'chat' | 'results'>('target-selection');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Mock data for development
  const [targets, setTargets] = useState<Target[]>([
    { id: '1', name: 'Sarah', created_at: '2024-01-15' },
    { id: '2', name: 'Alex', created_at: '2024-01-20' }
  ]);

  useEffect(() => {
    // Check if user is authenticated on app load
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = (tier: string) => {
    setUserTier(tier);
    setShowSubscriptionModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserTier(null);
    setCurrentView('target-selection');
    setSelectedTarget(null);
    setCurrentSession(null);
    setShowAuthModal(true);
  };

  const handleTargetSelect = (target: Target) => {
    setSelectedTarget(target);
    const newSession: SessionData = {
      id: Math.random().toString(36).substr(2, 9),
      target_id: target.id,
      status: 'gathering_info',
      messages: [{
        id: '1',
        content: `Welcome to your confidential coaching space. I'm Echo, your personal communication strategist. I see we're focusing on ${target.name} today. How did our last strategy work out for you?`,
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

  if (!isAuthenticated || !userTier) {
    return (
      <div className="min-h-screen confidential-atmosphere flex items-center justify-center">
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
        />
        <SubscriptionModal 
          isOpen={showSubscriptionModal}
          onClose={() => {}}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen confidential-atmosphere">
      {/* Professional Header */}
      <header className="border-b border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-serif font-semibold text-foreground">Echo Strategist</h1>
                <p className="text-xs text-muted-foreground">Your Confidential Coaching Space</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary capitalize">{userTier}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubscriptionModal(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
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
      </main>

      <PaywallModal 
        isOpen={showPaywall}
        onPaymentComplete={handlePaymentComplete}
      />

      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default Index;
