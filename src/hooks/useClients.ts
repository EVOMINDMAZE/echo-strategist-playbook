
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/coaching';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
    
    // Set up real-time subscription for targets table
    const channel = supabase
      .channel('targets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'targets' },
        (payload) => {
          console.log('Target change detected:', payload);
          loadClients(); // Reload clients when any target changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, setting empty clients');
        setClients([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        setClients([]);
      } else {
        console.log('Loaded clients:', data?.length || 0);
        const formattedClients: Client[] = data?.map(target => ({
          id: target.id,
          name: target.target_name,
          created_at: target.created_at,
          is_favorite: target.is_favorite || false
        })) || [];

        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (name: string): Promise<Client> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('targets')
      .insert({ 
        target_name: name,
        user_id: user.id 
      })
      .select()
      .single();

    if (error) throw error;

    const newClient: Client = {
      id: data.id,
      name: data.target_name,
      created_at: data.created_at,
      is_favorite: data.is_favorite || false
    };

    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const toggleFavorite = async (clientId: string): Promise<void> => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newFavoriteStatus = !client.is_favorite;

    // Optimistic update
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, is_favorite: newFavoriteStatus } : c
    ));

    try {
      const { error } = await supabase
        .from('targets')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', clientId);

      if (error) {
        // Revert optimistic update on error
        setClients(prev => prev.map(c => 
          c.id === clientId ? { ...c, is_favorite: client.is_favorite } : c
        ));
        throw error;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  return {
    clients,
    loading,
    createClient,
    toggleFavorite,
    loadClients
  };
};
