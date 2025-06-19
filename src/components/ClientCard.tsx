
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

  const cardClasses = isFavoriteView 
    ? "group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg transform hover:-translate-y-1"
    : "group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg transform hover:-translate-y-1";

  const avatarClasses = isFavoriteView
    ? "w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform flex-shrink-0"
    : "w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform flex-shrink-0";

  const titleHoverClass = isFavoriteView ? "group-hover:text-orange-600" : "group-hover:text-blue-600";

  return (
    <Card 
      className={cardClasses}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <div className={avatarClasses}>
                {client.name.charAt(0).toUpperCase()}
              </div>
              {hasExistingSessions && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{sessionCount}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className={`text-lg ${titleHoverClass} transition-colors flex items-center gap-2`}>
                <span className="truncate" title={client.name}>{client.name}</span>
                {isFavoriteView && <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
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
              onClick={() => onToggleFavorite(client.id, client.name)}
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
                <DropdownMenuItem onClick={() => onToggleFavorite(client.id, client.name)}>
                  {client.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${
          isFavoriteView 
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100' 
            : hasExistingSessions 
              ? 'bg-gradient-to-r from-green-50 to-blue-50' 
              : 'bg-gradient-to-r from-gray-50 to-blue-50'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${isFavoriteView ? 'text-gray-700' : 'text-gray-600'}`}>
              {isFavoriteView ? '⭐ Favorite Client' : hasExistingSessions ? 'Session History' : 'Recent Activity'}
            </span>
            <Badge variant={isFavoriteView ? undefined : "secondary"} className={
              isFavoriteView ? "bg-yellow-200 text-yellow-800 text-xs" : "text-xs"
            }>
              {hasExistingSessions ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''}` : 'New'}
            </Badge>
          </div>
          <p className={`text-xs mt-2 ${isFavoriteView ? 'text-gray-600' : 'text-gray-500'}`}>
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
            className={`w-full flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105 ${
              isFavoriteView 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
            }`}
          >
            <ArrowRight size={16} />
            {isFavoriteView ? 'Continue Priority Session' : 'Continue Session'}
          </Button>
        ) : (
          <Button 
            onClick={() => onStartSession(client.id, client.name)}
            className={`w-full flex items-center justify-center gap-2 group-hover:shadow-lg transition-all transform group-hover:scale-105 ${
              isFavoriteView 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            <PlayCircle size={16} />
            {isFavoriteView ? 'Start Priority Session' : 'Start First Session'}
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
};
