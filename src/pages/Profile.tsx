
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { UserIcon, Mail } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
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

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password reset sent",
          description: "Check your email for password reset instructions."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <UserIcon size={20} />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <Input 
                    value={user.email || ''} 
                    disabled 
                    className="bg-input text-foreground border-border"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  User ID
                </label>
                <Input 
                  value={user.id} 
                  disabled 
                  className="font-mono text-xs bg-input text-foreground border-border" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Account Created
                </label>
                <Input 
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled 
                  className="bg-input text-foreground border-border"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Reset your password to keep your account secure.
                </p>
                <Button 
                  onClick={handlePasswordReset}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
