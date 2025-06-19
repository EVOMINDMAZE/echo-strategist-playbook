
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Crown, Calendar, CreditCard, CheckCircle } from 'lucide-react';

const Subscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your coaching plan and billing information
          </p>
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
                <h3 className="text-xl font-semibold text-gray-900">Professional Plan</h3>
                <p className="text-gray-600">Unlimited conversations and advanced AI coaching</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next billing: January 19, 2025
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Active
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$79</div>
                <div className="text-gray-500">per month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">∞</div>
                <div className="text-gray-600">Conversations</div>
                <div className="text-sm text-gray-500">Unlimited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-gray-600">Support</div>
                <div className="text-sm text-gray-500">Priority access</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">✓</div>
                <div className="text-gray-600">Advanced AI</div>
                <div className="text-sm text-gray-500">Full access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Payment Method</div>
                  <div className="text-gray-600">•••• •••• •••• 4242</div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Billing Address</div>
                  <div className="text-gray-600">San Francisco, CA</div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Management */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/pricing')}
              >
                Change Plan
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
