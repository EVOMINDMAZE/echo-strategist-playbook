
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';
import { WorldClassNavigation } from '@/components/WorldClassNavigation';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Plus, Users, Calendar, MessageSquare, TrendingUp, Star, Heart, Filter, Search, MoreVertical, PlayCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Clients = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [clientSessions, setClientSessions] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    clients,
    loading,
    createClient,
    createSession,
    toggleFavorite
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

  // Load session counts for each client
  useEffect(() => {
    const loadSessionCounts = async () => {
      if (!user || clients.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('coaching_sessions')
          .select('target_id, status')
          .in('target_id', clients.map(c => c.id));

        if (error) throw error;

        const sessionCounts: Record<string, number> = {};
        data?.forEach(session => {
          sessionCounts[session.target_id] = (sessionCounts[session.target_id] || 0) + 1;
        });

        setClientSessions(sessionCounts);
      } catch (error) {
        console.error('Error loading session counts:', error);
      }
    };

    loadSessionCounts();
  }, [user, clients]);

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

  const handleContinueSession = async (clientId: string, clientName: string) => {
    try {
      // Find the most recent session for this client
      const { data: recentSession } = await supabase
        .from('coaching_sessions')
        .select('id')
        .eq('target_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentSession) {
        navigate(`/chat/${recentSession.id}?target=${encodeURIComponent(clientName)}`);
      } else {
        // Fallback to creating new session
        handleStartSession(clientId, clientName);
      }
    } catch (error) {
      console.error('Error continuing session:', error);
      toast({
        title: "Error",
        description: "Failed to continue session. Starting new session instead.",
        variant: "destructive"
      });
      handleStartSession(clientId, clientName);
    }
  };

  const handleToggleFavorite = async (clientId: string, clientName: string) => {
    try {
      await toggleFavorite(clientId);
      const client = clients.find(c => c.id === clientId);
      const isFavorite = client?.is_favorite;
      toast({
        title: isFavorite ? "Removed from favorites 💔" : "Added to favorites ⭐",
        description: `${clientName} has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive"
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'favorites') {
      return matchesSearch && client.is_favorite;
    }
    return matchesSearch;
  });

  const favoriteClients = clients.filter(client => client.is_favorite);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <WorldClassNavigation user={user} />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <WorldClassNavigation user={user} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              My Clients
            </h1>
            <p className="mt-2 text-xl text-gray-600">
              Manage your coaching relationships and track progress
            </p>
            <div className="flex flex-wrap items-center mt-4 gap-3">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                <Users className="w-4 h-4 mr-1" />
                {clients.length} Total Client{clients.length !== 1 ? 's' : ''}
              </Badge>
              {favoriteClients.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  {favoriteClients.length} Favorite{favoriteClients.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Growing Strong
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                  <Plus size={16} />
                  Add New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm sm:max-w-md">
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users size={16} />
              All Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star size={16} />
              Favorites ({favoriteClients.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredClients.length === 0 ? (
              searchTerm ? (
                <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardContent>
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
                    <p className="text-gray-600 mb-4">
                      No clients match your search for "{searchTerm}"
                    </p>
                    <Button 
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                    >
                      Clear search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
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
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      <Plus size={20} className="mr-2" />
                      Add Your First Client
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client, index) => {
                  const sessionCount = clientSessions[client.id] || 0;
                  const hasExistingSessions = sessionCount > 0;
                  
                  return (
                    <Card 
                      key={client.id} 
                      className="group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              {hasExistingSessions && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{sessionCount}</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors truncate" title={client.name}>
                                {client.name}
                              </CardTitle>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar size={12} />
                                <span className="truncate">
                                  Added {new Date(client.created_at).toLocaleDateString()}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFavorite(client.id, client.name)}
                              className="h-8 w-8 hover:bg-yellow-50"
                            >
                              <Star 
                                size={16} 
                                className={`transition-colors ${
                                  client.is_favorite 
                                    ? 'text-yellow-500 fill-yellow-500' 
                                    : 'text-gray-400 hover:text-yellow-500'
                                }`}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleToggleFavorite(client.id, client.name)}>
                                  {client.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className={`p-4 rounded-lg ${hasExistingSessions ? 'bg-gradient-to-r from-green-50 to-blue-50' : 'bg-gradient-to-r from-gray-50 to-blue-50'}`}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                              {hasExistingSessions ? 'Session History' : 'Recent Activity'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {hasExistingSessions ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''}` : 'New'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {hasExistingSessions 
                              ? 'Continue your coaching journey together'
                              : 'Ready for your first coaching session'
                            }
                          </p>
                        </div>
                        
                        {hasExistingSessions ? (
                          <Button 
                            onClick={() => handleContinueSession(client.id, client.name)}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105"
                          >
                            <ArrowRight size={16} />
                            Continue Session
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStartSession(client.id, client.name)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105"
                          >
                            <PlayCircle size={16} />
                            Start First Session
                          </Button>
                        )}
                        
                        <div className="text-xs text-gray-500 text-center">
                          {hasExistingSessions 
                            ? 'Pick up where you left off with AI coaching'
                            : 'Begin an AI-powered coaching conversation'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            {favoriteClients.length === 0 ? (
              <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent>
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite clients yet</h3>
                  <p className="text-gray-600 mb-4">
                    Star your favorite clients to see them here for quick access.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteClients.filter(client => 
                  client.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((client, index) => {
                  const sessionCount = clientSessions[client.id] || 0;
                  const hasExistingSessions = sessionCount > 0;
                  
                  return (
                    <Card 
                      key={client.id} 
                      className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              {hasExistingSessions && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{sessionCount}</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg group-hover:text-orange-600 transition-colors flex items-center gap-2">
                                <span className="truncate" title={client.name}>{client.name}</span>
                                <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              </CardTitle>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar size={12} />
                                <span className="truncate">
                                  Added {new Date(client.created_at).toLocaleDateString()}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 font-medium">⭐ Favorite Client</span>
                            <Badge className="bg-yellow-200 text-yellow-800 text-xs">
                              {hasExistingSessions ? `${sessionCount} sessions` : 'New'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {hasExistingSessions 
                              ? 'Your starred client with ongoing coaching'
                              : 'Your starred client - ready for coaching'
                            }
                          </p>
                        </div>
                        
                        {hasExistingSessions ? (
                          <Button 
                            onClick={() => handleContinueSession(client.id, client.name)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105 text-white"
                          >
                            <ArrowRight size={16} />
                            Continue Priority Session
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStartSession(client.id, client.name)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105 text-white"
                          >
                            <PlayCircle size={16} />
                            Start Priority Session
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Pro Tips Section */}
        {clients.length > 0 && (
          <Card className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Star className="w-5 h-5 mr-2" />
                Pro Tips for Better Coaching Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-purple-900">Context is Key</h4>
                  </div>
                  <p className="text-purple-700 pl-10">
                    Start with context - briefly describe the situation before asking for advice
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-purple-900">Be Specific</h4>
                  </div>
                  <p className="text-purple-700 pl-10">
                    Set clear goals: "improve relationship" vs "handle criticism better"
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-purple-900">Follow Up</h4>
                  </div>
                  <p className="text-purple-700 pl-10">
                    Track progress across sessions to get refined, personalized advice
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
