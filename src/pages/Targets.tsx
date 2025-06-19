
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Plus, Target as TargetIcon, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';

const Targets = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newTargetName, setNewTargetName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    targets,
    loading,
    createTarget,
    createSession
  } = useSupabaseCoaching();

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

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName.trim()) return;

    try {
      await createTarget(newTargetName.trim());
      setNewTargetName('');
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "New target created successfully!"
      });
    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: "Error",
        description: "Failed to create target. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartSession = async (targetId: string, targetName: string) => {
    try {
      const session = await createSession(targetId);
      navigate(`/chat/${session.id}?target=${encodeURIComponent(targetName)}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to start coaching session. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Targets</h1>
            <p className="mt-2 text-gray-600">Manage your coaching targets and start new sessions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Add New Target
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Target</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTarget} className="space-y-4">
                <Input
                  placeholder="Enter target name (e.g., John Smith)"
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Create Target</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {targets.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
              <CardTitle className="text-xl text-gray-900">No targets yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create your first coaching target to get started
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Create First Target
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Your First Target</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTarget} className="space-y-4">
                    <Input
                      placeholder="Enter target name (e.g., John Smith)"
                      value={newTargetName}
                      onChange={(e) => setNewTargetName(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full">Create Target</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.map((target) => (
              <Card key={target.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TargetIcon size={20} />
                    {target.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    Created {new Date(target.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleStartSession(target.id, target.name)}
                    className="w-full"
                  >
                    Start Coaching Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Targets;
