
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';
import { EnhancedNavigation } from '@/components/EnhancedNavigation';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Plus, Users, Calendar, MessageSquare, TrendingUp, Star } from 'lucide-react';
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
        title: "Success! 🎉",
        description: `${newClientName} has been added to your coaching roster.`
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
        <EnhancedNavigation user={user} />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <LoadingSkeleton rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <LoadingSkeleton rows={3} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <EnhancedNavigation user={user} />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              My Clients
            </h1>
            <p className="mt-2 text-xl text-gray-600">
              Manage your coaching relationships and track progress
            </p>
            <div className="flex items-center mt-4 space-x-4">
              <Badge className="bg-blue-100 text-blue-800">
                <Users className="w-4 h-4 mr-1" />
                {clients.length} Active Client{clients.length !== 1 ? 's' : ''}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="w-4 h-4 mr-1" />
                Growing Strong
              </Badge>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Plus size={16} />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Add New Client
                </DialogTitle>
                <p className="text-gray-600">
                  Start a new coaching relationship and help them achieve their goals.
                </p>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name
                  </label>
                  <Input
                    placeholder="Enter client name (e.g., John Smith)"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Add Client
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {clients.length === 0 ? (
          <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0 animate-scale-in">
            <CardHeader>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900 mb-4">
                Ready to Start Coaching?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Add your first client and begin transforming relationships with 
                AI-powered coaching strategies tailored to your unique style.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    <Plus size={20} className="mr-2" />
                    Add Your First Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      Add Your First Client
                    </DialogTitle>
                    <p className="text-gray-600">
                      Let's get started with your coaching journey!
                    </p>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Name
                      </label>
                      <Input
                        placeholder="Enter client name (e.g., John Smith)"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Add Client & Start Coaching
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => (
              <Card 
                key={client.id} 
                className="group hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg transform hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          Added {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Star className="w-5 h-5 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Recent Activity</span>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ready for your next coaching session
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => handleStartSession(client.id, client.name)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105"
                  >
                    <MessageSquare size={16} />
                    Start Coaching Session
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Click to begin an AI-powered coaching conversation
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Tips Section */}
        {clients.length > 0 && (
          <Card className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Star className="w-5 h-5 mr-2" />
                Pro Tips for Better Coaching Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <p className="text-purple-700">
                    Start with context - briefly describe the situation before asking for advice
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <p className="text-purple-700">
                    Be specific about your goals -"improve relationship" vs "handle criticism better"
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <p className="text-purple-700">
                    Follow up on previous sessions to track progress and get refined advice
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Clients;
