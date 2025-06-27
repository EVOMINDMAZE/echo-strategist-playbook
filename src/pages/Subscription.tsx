
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/PublicHeader';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Crown, Calendar, CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const Subscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscription, loading: subLoading, checkSubscription, openCustomerPortal } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Check for success/cancel params
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Success!",
        description: "Your subscription has been activated. It may take a few moments to update.",
      });
      // Refresh subscription status
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Canceled",
        description: "Your subscription was not completed.",
        variant: "destructive"
      });
    }
  }, [searchParams, checkSubscription, toast]);

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const tierInfo = {
    'Starter': { price: 29, color: 'text-green-600', bgColor: 'bg-green-100' },
    'Professional': { price: 79, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    'Executive': { price: 149, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  };

  const currentTier = subscription.subscription_tier || 'Free';
  const currentTierInfo = tierInfo[currentTier as keyof typeof tierInfo] || { price: 0, color: 'text-gray-600', bgColor: 'bg-gray-100' };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader user={user} />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-2 text-gray-600">
              Manage your coaching plan and billing information
            </p>
          </div>
          <Button
            onClick={checkSubscription}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{currentTier} Plan</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentTierInfo.bgColor} ${currentTierInfo.color}`}>
                    {subscription.subscribed ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600">
                  {subscription.subscribed 
                    ? `${currentTier} plan with advanced AI coaching features`
                    : 'No active subscription - upgrade to unlock full features'
                  }
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {subscription.subscribed && (
                    <>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next billing: {formatDate(subscription.subscription_end)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Active
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${subscription.subscribed ? currentTierInfo.price : 0}
                </div>
                <div className="text-gray-500">per month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {subscription.subscribed ? '∞' : '5'}
                </div>
                <div className="text-gray-600">Conversations</div>
                <div className="text-sm text-gray-500">
                  {subscription.subscribed ? 'Unlimited' : 'Limited'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {subscription.subscribed ? '24/7' : '❌'}
                </div>
                <div className="text-gray-600">Support</div>
                <div className="text-sm text-gray-500">
                  {subscription.subscribed ? 'Priority access' : 'Email only'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {subscription.subscribed ? '✓' : '❌'}
                </div>
                <div className="text-gray-600">Advanced AI</div>
                <div className="text-sm text-gray-500">
                  {subscription.subscribed ? 'Full access' : 'Basic only'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription.subscribed ? (
                <>
                  <Button 
                    onClick={openCustomerPortal}
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    Update payment method, change plan, or cancel subscription
                  </p>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="w-full"
                  >
                    Choose Plan
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    Upgrade to unlock unlimited conversations and advanced AI features
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
