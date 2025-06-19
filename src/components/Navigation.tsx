
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, User as UserIcon, Settings, LogOut, Home, Target, Info, DollarSign } from 'lucide-react';

interface NavigationProps {
  user?: User | null;
  onSignOut?: () => void;
}

export const Navigation = ({ user, onSignOut }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onSignOut) onSignOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Coaching Assistant
            </button>
            
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home size={16} />
                Dashboard
              </Button>
              <Button
                variant={isActive('/about') ? 'default' : 'ghost'}
                onClick={() => navigate('/about')}
                className="flex items-center gap-2"
              >
                <Info size={16} />
                About
              </Button>
              <Button
                variant={isActive('/pricing') ? 'default' : 'ghost'}
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2"
              >
                <DollarSign size={16} />
                Pricing
              </Button>
              {user && (
                <Button
                  variant={isActive('/targets') ? 'default' : 'ghost'}
                  onClick={() => navigate('/targets')}
                  className="flex items-center gap-2"
                >
                  <Target size={16} />
                  My Targets
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <Menu size={20} />
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-gray-50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                className="w-full justify-start gap-2"
              >
                <Home size={16} />
                Dashboard
              </Button>
              <Button
                variant={isActive('/about') ? 'default' : 'ghost'}
                onClick={() => { navigate('/about'); setIsMenuOpen(false); }}
                className="w-full justify-start gap-2"
              >
                <Info size={16} />
                About
              </Button>
              <Button
                variant={isActive('/pricing') ? 'default' : 'ghost'}
                onClick={() => { navigate('/pricing'); setIsMenuOpen(false); }}
                className="w-full justify-start gap-2"
              >
                <DollarSign size={16} />
                Pricing
              </Button>
              {user && (
                <>
                  <Button
                    variant={isActive('/targets') ? 'default' : 'ghost'}
                    onClick={() => { navigate('/targets'); setIsMenuOpen(false); }}
                    className="w-full justify-start gap-2"
                  >
                    <Target size={16} />
                    My Targets
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                    className="w-full justify-start gap-2"
                  >
                    <UserIcon size={16} />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                    className="w-full justify-start gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-red-600"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
