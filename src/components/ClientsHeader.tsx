
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        <AddClientDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreateClient={handleCreateClient}
        />
      </div>
    </div>
  );
};
