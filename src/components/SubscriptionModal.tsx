
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Shield, Sparkles } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess: (tier: string) => void;
}

const subscriptionTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    icon: Zap,
    description: 'Perfect for exploring your communication style',
    features: [
      '5 conversations per month',
      'Basic AI coaching',
      'Text-based insights',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    icon: Crown,
    description: 'For serious relationship and career growth',
    features: [
      'Unlimited conversations',
      'Advanced AI strategist',
      'Deep psychological insights',
      'Priority support',
      'Success tracking',
      'Custom strategies'
    ],
    popular: true
  },
  {
    id: 'executive',
    name: 'Executive',
    price: 149,
    icon: Shield,
    description: 'Ultimate coaching for high-stakes situations',
    features: [
      'Everything in Professional',
      'Real-time conversation coaching',
      'Advanced psychology models',
      'Personal success manager',
      'Crisis intervention support',
      'Exclusive strategies database'
    ],
    popular: false
  }
];

export const SubscriptionModal = ({ isOpen, onClose, onSubscriptionSuccess }: SubscriptionModalProps) => {
  const [selectedTier, setSelectedTier] = useState('professional');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (tierId: string) => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onSubscriptionSuccess(tierId);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />
        
        <div className="relative w-full max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif text-white mb-4">Choose Your Coaching Level</h2>
            <p className="text-xl text-gray-300">Unlock your potential with professional guidance</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {subscriptionTiers.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === tier.id;
              
              return (
                <Card
                  key={tier.id}
                  className={`relative glass-card border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                    tier.popular ? 'tier-professional animate-glow-pulse' : 
                    tier.id === 'starter' ? 'tier-starter' : 'tier-executive'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full ${
                        tier.id === 'starter' ? 'bg-green-500/20' :
                        tier.id === 'professional' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                      }`}>
                        <Icon className={`w-8 h-8 ${
                          tier.id === 'starter' ? 'text-green-400' :
                          tier.id === 'professional' ? 'text-blue-400' : 'text-orange-400'
                        }`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-serif text-white mb-2">
                      {tier.name}
                    </CardTitle>
                    <div className="text-3xl font-bold text-white mb-2">
                      ${tier.price}
                      <span className="text-lg font-normal text-gray-400">/month</span>
                    </div>
                    <p className="text-gray-300 text-sm">{tier.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3 text-gray-200">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isProcessing}
                      className={`w-full h-12 mt-6 ${
                        tier.id === 'starter' ? 'bg-green-600 hover:bg-green-700' :
                        tier.id === 'professional' ? 'bg-blue-600 hover:bg-blue-700' : 
                        'bg-orange-600 hover:bg-orange-700'
                      } transition-all duration-300`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <span>Start {tier.name} Plan</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              30-day money-back guarantee • Cancel anytime • Secure payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
