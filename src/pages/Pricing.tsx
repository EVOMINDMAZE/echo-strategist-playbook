
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useSubscription } from '@/hooks/useSubscription';

const Pricing = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { subscription, createCheckoutSession } = useSubscription();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getUser();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      icon: Zap,
      description: 'Perfect for exploring your communication style',
      features: [
        '50 conversations per month',
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

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    await createCheckoutSession(planId);
  };

  const isCurrentPlan = (planId: string) => {
    const tierMap: { [key: string]: string } = {
      'starter': 'Starter',
      'professional': 'Professional',
      'executive': 'Executive'
    };
    return subscription.subscribed && subscription.subscription_tier === tierMap[planId];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Coaching Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock your potential with AI-powered conversation coaching tailored to your goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);
            
            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full ${
                      plan.id === 'starter' ? 'bg-green-100' :
                      plan.id === 'professional' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`w-8 h-8 ${
                        plan.id === 'starter' ? 'text-green-600' :
                        plan.id === 'professional' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent}
                    className={`w-full h-12 ${
                      isCurrent ? 'bg-green-500 hover:bg-green-600' :
                      plan.id === 'starter' ? 'bg-green-600 hover:bg-green-700' :
                      plan.id === 'professional' ? 'bg-blue-600 hover:bg-blue-700' : 
                      'bg-purple-600 hover:bg-purple-700'
                    } transition-all duration-300`}
                  >
                    {isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            30-day money-back guarantee • Cancel anytime • Secure payment with Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
