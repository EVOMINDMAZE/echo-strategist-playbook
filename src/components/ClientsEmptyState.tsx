
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Plus } from 'lucide-react';

interface ClientsEmptyStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
  onAddClient?: () => void;
  type: 'no-clients' | 'no-search-results' | 'no-favorites';
}

export const ClientsEmptyState = ({ 
  searchTerm, 
  onClearSearch, 
  onAddClient, 
  type 
}: ClientsEmptyStateProps) => {
  if (type === 'no-search-results' && searchTerm) {
    return (
      <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardContent>
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-4">
            No clients match your search for "{searchTerm}"
          </p>
          <Button 
            onClick={onClearSearch}
            variant="outline"
          >
            Clear search
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === 'no-favorites') {
    return (
      <Card className="text-center py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardContent>
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">❤️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite clients yet</h3>
          <p className="text-gray-600 mb-4">
            Star your favorite clients to see them here for quick access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
          onClick={onAddClient}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Plus size={20} className="mr-2" />
          Add Your First Client
        </Button>
      </CardContent>
    </Card>
  );
};
