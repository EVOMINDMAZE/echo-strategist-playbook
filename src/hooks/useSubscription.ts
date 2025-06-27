
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        // Don't show error toast for missing Stripe key in development
        if (!error.message?.includes('STRIPE_SECRET_KEY')) {
          console.error('Subscription check error:', error);
          toast({
            title: "Subscription Check Failed",
            description: "Unable to verify subscription status. Please try again later.",
            variant: "destructive"
          });
        }
        
        // Set default values for development
        setSubscription({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null
        });
        return;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Silent fail in development when Stripe is not configured
      setSubscription({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (tier: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });
      
      if (error) {
        if (error.message?.includes('STRIPE_SECRET_KEY')) {
          toast({
            title: "Development Mode",
            description: "Stripe checkout is not configured in development mode.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        if (error.message?.includes('STRIPE_SECRET_KEY')) {
          toast({
            title: "Development Mode",
            description: "Customer portal is not configured in development mode.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal
  };
};
