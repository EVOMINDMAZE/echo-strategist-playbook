
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Plus, Users, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';

const Clients = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    clients,
    loading,
    createClient,
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      await createClient(newClientName.trim());
      setNewClientName('');
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "New client added successfully!"
      });
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartSession = async (clientId: string, clientName: string) => {
    try {
      const session = await createSession(clientId);
      navigate(`/chat/${session.id}?target=${encodeURIComponent(clientName)}`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
            <p className="mt-2 text-gray-600">Manage your coaching clients and start new sessions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus size={16} />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <Input
                  placeholder="Enter client name (e.g., John Smith)"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Add Client</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {clients.length === 0 ? (
          <Card className="text-center py-12 bg-white shadow-md">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-blue-400" />
              <CardTitle className="text-xl text-gray-900">No clients yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add your first coaching client to get started
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Add First Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Your First Client</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <Input
                      placeholder="Enter client name (e.g., John Smith)"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full">Add Client</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    {client.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    Added {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => handleStartSession(client.id, client.name)}
                    className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Start Session
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    Click to begin a new coaching conversation
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
