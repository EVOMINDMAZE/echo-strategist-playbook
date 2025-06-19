
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { 
  Settings as SettingsIcon, 
  Brush, 
  Bell, 
  Clock, 
  MessageSquare, 
  User as UserIcon,
  Shield,
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  session_reminders: boolean;
  preferred_session_length: number;
  coaching_style: string;
  timezone: string;
}

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    push_notifications: true,
    session_reminders: true,
    preferred_session_length: 30,
    coaching_style: 'balanced',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      await loadPreferences(session.user.id);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          loadPreferences(session.user.id);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setPreferences({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          session_reminders: data.session_reminders,
          preferred_session_length: data.preferred_session_length,
          coaching_style: data.coaching_style,
          timezone: data.timezone
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <WorldClassNavigation user={null} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <WorldClassNavigation user={user} />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400">
            Settings & Preferences
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Customize your coaching experience to match your style
          </p>
        </div>

        {/* Profile Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <UserIcon className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</Label>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {user.user_metadata?.full_name || 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Notifications</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Receive session reminders and updates via email
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, email_notifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Push Notifications</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Get notified about important coaching updates
                </p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, push_notifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Reminders</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Remind me before scheduled coaching sessions
                </p>
              </div>
              <Switch
                checked={preferences.session_reminders}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, session_reminders: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Coaching Preferences */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <MessageSquare className="w-5 h-5" />
              Coaching Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Preferred Session Length
              </Label>
              <div className="px-2">
                <Slider
                  value={[preferences.preferred_session_length]}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, preferred_session_length: value[0] }))
                  }
                  max={60}
                  min={15}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>15 min</span>
                  <span className="font-medium">{preferences.preferred_session_length} min</span>
                  <span>60 min</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Coaching Style
              </Label>
              <Select
                value={preferences.coaching_style}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, coaching_style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supportive">Supportive & Encouraging</SelectItem>
                  <SelectItem value="direct">Direct & Straightforward</SelectItem>
                  <SelectItem value="balanced">Balanced Approach</SelectItem>
                  <SelectItem value="analytical">Analytical & Data-Driven</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Timezone
              </Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={savePreferences}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        <Separator className="my-8" />

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Delete Account</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
