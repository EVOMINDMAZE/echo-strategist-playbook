
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Star, MoreVertical, ArrowRight, PlayCircle } from 'lucide-react';
import type { Client } from '@/types/coaching';

interface ClientCardProps {
  client: Client;
  index: number;
  sessionCount: number;
  onStartSession: (clientId: string, clientName: string) => void;
  onContinueSession: (clientId: string, clientName: string) => void;
  onToggleFavorite: (clientId: string, clientName: string) => void;
  isFavoriteView?: boolean;
}

export const ClientCard = ({ 
  client, 
  index, 
  sessionCount, 
  onStartSession, 
  onContinueSession, 
  onToggleFavorite,
  isFavoriteView = false
}: ClientCardProps) => {
  const hasExistingSessions = sessionCount > 0;

  return (
    <Card 
      className="group professional-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform flex-shrink-0 ${
                isFavoriteView 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                  : 'bg-primary'
              }`}>
                {client.name.charAt(0).toUpperCase()}
              </div>
              {hasExistingSessions && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shadow-professional">
                  <span className="text-xs text-white font-bold">{sessionCount}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg professional-text-primary group-hover:text-primary transition-colors flex items-center gap-2 mb-1">
                <span className="truncate font-serif" title={client.name}>{client.name}</span>
                {isFavoriteView && <Star size={16} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
              </CardTitle>
              <p className="text-sm professional-text-secondary flex items-center gap-1">
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
              onClick={() => onToggleFavorite(client.id, client.name)}
              className="h-8 w-8 hover:bg-muted"
            >
              <Star 
                size={16} 
                className={`transition-colors professional-interactive ${
                  client.is_favorite 
                    ? 'text-amber-500 fill-amber-500' 
                    : 'hover:text-amber-500'
                }`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} className="professional-interactive" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="professional-card">
                <DropdownMenuItem 
                  onClick={() => onToggleFavorite(client.id, client.name)}
                  className="professional-text-primary cursor-pointer"
                >
                  {client.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg border ${
          isFavoriteView 
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/30' 
            : hasExistingSessions 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/30'
              : 'bg-muted border-border'
        }`}>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium professional-text-primary">
              {isFavoriteView ? '⭐ Favorite Client' : hasExistingSessions ? 'Session History' : 'Recent Activity'}
            </span>
            <Badge 
              variant={hasExistingSessions ? "success" : "secondary"} 
              className="text-xs"
            >
              {hasExistingSessions ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''}` : 'New'}
            </Badge>
          </div>
          <p className="text-xs professional-text-muted">
            {isFavoriteView 
              ? hasExistingSessions 
                ? 'Your starred client with ongoing coaching'
                : 'Your starred client - ready for coaching'
              : hasExistingSessions 
                ? 'Continue your coaching journey together'
                : 'Ready for your first coaching session'
            }
          </p>
        </div>
        
        {hasExistingSessions ? (
          <Button 
            onClick={() => onContinueSession(client.id, client.name)}
            className={`w-full flex items-center justify-center gap-2 professional-button ${
              isFavoriteView 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                : ''
            }`}
          >
            <ArrowRight size={16} />
            {isFavoriteView ? 'Continue Priority Session' : 'Continue Session'}
          </Button>
        ) : (
          <Button 
            onClick={() => onStartSession(client.id, client.name)}
            className={`w-full flex items-center justify-center gap-2 professional-button ${
              isFavoriteView 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                : ''
            }`}
          >
            <PlayCircle size={16} />
            {isFavoriteView ? 'Start Priority Session' : 'Start First Session'}
          </Button>
        )}
        
        <div className="text-xs professional-text-muted text-center">
          {hasExistingSessions 
            ? 'Pick up where you left off with AI coaching'
            : 'Begin an AI-powered coaching conversation'
          }
        </div>
      </CardContent>
    </Card>
  );
};
