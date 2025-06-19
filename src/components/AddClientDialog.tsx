
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateClient: (name: string) => Promise<void>;
}

export const AddClientDialog = ({ isOpen, onOpenChange, onCreateClient }: AddClientDialogProps) => {
  const [newClientName, setNewClientName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    await onCreateClient(newClientName.trim());
    setNewClientName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
