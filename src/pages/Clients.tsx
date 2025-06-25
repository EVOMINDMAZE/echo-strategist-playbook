
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ClientsHeader } from '@/components/ClientsHeader';
import { ClientCard } from '@/components/ClientCard';
import { ClientsEmptyState } from '@/components/ClientsEmptyState';
import { ClientsProTips } from '@/components/ClientsProTips';
import { Users, Star, TrendingUp, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const Clients = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [clientSessions, setClientSessions] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleCreateClient = async (name: string) => {
    try {
      await createClient(name);
      toast({
        title: "Welcome! 🌟",
        description: `${name} has been added to your coaching roster.`
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <LoadingSkeleton rows={2} />
          </div>
          <div className="professional-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse professional-card h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* High Contrast Professional Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-6 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-4xl font-bold font-serif professional-text-primary mb-3">
              My Clients
            </h1>
            <p className="text-lg professional-text-secondary mb-6 font-medium">
              Manage your coaching relationships and track progress
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="info" className="px-4 py-2 text-sm">
                <Users className="w-4 h-4 mr-2" />
                {clients.length} Total Client{clients.length !== 1 ? 's' : ''}
              </Badge>
              {favoriteClients.length > 0 && (
                <Badge variant="warning" className="px-4 py-2 text-sm">
                  <Star className="w-4 h-4 mr-2" />
                  {favoriteClients.length} Favorite{favoriteClients.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="success" className="px-4 py-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Growing Strong
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 professional-text-secondary w-5 h-5" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full sm:w-80 professional-input text-base py-3"
              />
            </div>
            <ClientsHeader
              clients={clients}
              favoriteClients={favoriteClients}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onCreateClient={handleCreateClient}
            />
          </div>
        </div>

        {/* High Contrast Professional Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-2 bg-card shadow-lg border-2 border-border p-2 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-3 professional-tab-inactive data-[state=active]:professional-tab-active font-semibold text-base py-3 rounded-lg transition-all duration-200"
            >
              <Users size={18} />
              All Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="flex items-center gap-3 professional-tab-inactive data-[state=active]:professional-tab-active font-semibold text-base py-3 rounded-lg transition-all duration-200"
            >
              <Star size={18} />
              Favorites ({favoriteClients.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {filteredClients.length === 0 ? (
              <ClientsEmptyState
                searchTerm={searchTerm}
                onClearSearch={() => setSearchTerm('')}
                onAddClient={() => setIsDialogOpen(true)}
                type={searchTerm ? 'no-search-results' : 'no-clients'}
              />
            ) : (
              <div className="professional-grid">
                {filteredClients.map((client, index) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    index={index}
                    sessionCount={clientSessions[client.id] || 0}
                    onStartSession={handleStartSession}
                    onContinueSession={handleContinueSession}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-8">
            {favoriteClients.filter(client => 
              client.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 ? (
              <ClientsEmptyState type="no-favorites" />
            ) : (
              <div className="professional-grid">
                {favoriteClients.filter(client => 
                  client.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((client, index) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    index={index}
                    sessionCount={clientSessions[client.id] || 0}
                    onStartSession={handleStartSession}
                    onContinueSession={handleContinueSession}
                    onToggleFavorite={handleToggleFavorite}
                    isFavoriteView={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {clients.length > 0 && <ClientsProTips />}
      </div>
    </div>
  );
};

export default Clients;
