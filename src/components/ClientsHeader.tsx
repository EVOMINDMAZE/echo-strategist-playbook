
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Star, TrendingUp, Search } from 'lucide-react';
import { AddClientDialog } from '@/components/AddClientDialog';
import type { Client } from '@/types/coaching';

interface ClientsHeaderProps {
  clients: Client[];
  favoriteClients: Client[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClient: (name: string) => Promise<void>;
}

export const ClientsHeader = ({ 
  clients, 
  favoriteClients, 
  searchTerm, 
  onSearchChange, 
  onCreateClient 
}: ClientsHeaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateClient = async (name: string) => {
    await onCreateClient(name);
    setIsDialogOpen(false);
  };

  return (
    <AddClientDialog
      isOpen={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      onCreateClient={handleCreateClient}
    />
  );
};
