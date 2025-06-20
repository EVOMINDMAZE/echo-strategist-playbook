
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Bell,
  Search,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface EnhancedNavigationProps {
  user: SupabaseUser | null;
}

export const EnhancedNavigation = ({ user }: EnhancedNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientCount, setClientCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  // Load real client count
  useEffect(() => {
    const loadClientCount = async () => {
      if (!user) {
        setClientCount(0);
        setLoadingCount(false);
        return;
      }
      
      try {
        setLoadingCount(true);
        const { data, error } = await supabase
          .from('targets')
          .select('id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error loading client count:', error);
          setClientCount(0);
        } else {
          setClientCount(data?.length || 0);
        }
      } catch (error) {
        console.error('Error loading client count:', error);
        setClientCount(0);
      } finally {
        setLoadingCount(false);
      }
    };

    loadClientCount();

    // Set up real-time updates for client count
    if (user) {
      const channel = supabase
        .channel('targets-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'targets', filter: `user_id=eq.${user.id}` },
          () => {
            console.log('Targets changed, reloading count');
            loadClientCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const navigationItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      isActive: location.pathname === '/dashboard'
    },
    { 
      path: '/clients', 
      label: 'Chats', 
      icon: MessageSquare,
      isActive: location.pathname === '/clients',
      badge: loadingCount ? '...' : (clientCount > 0 ? clientCount.toString() : undefined)
    },
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      isActive: location.pathname === '/analytics'
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo section - fixed width to prevent shifting */}
          <div className="flex items-center flex-shrink-0 w-64">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <span className="hidden sm:block truncate">Coaching Assistant</span>
              <span className="sm:hidden">Coach</span>
            </button>
          </div>

          {/* Navigation items - centered */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-md">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={item.isActive ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className={`relative flex items-center space-x-2 transition-all duration-200 text-sm ${
                      item.isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Right section - fixed width */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 w-64 justify-end">
            {user && (
              <>
                {/* Search - hidden on small screens to save space */}
                <form onSubmit={handleQuickSearch} className="hidden lg:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-48"
                    />
                  </div>
                </form>

                {/* Notifications - simplified, no popup for now */}
                <Button variant="ghost" size="icon">
                  <Bell size={18} />
                </Button>

                <ThemeToggle />

                {/* User section */}
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:block text-right min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Coach
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/profile')}
                      className="hover:bg-blue-50"
                    >
                      <User size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/settings')}
                      className="hover:bg-blue-50"
                    >
                      <Settings size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut size={16} />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!user && (
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="flex justify-around py-2 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center space-y-1 relative min-w-0 flex-1 ${
                    item.isActive ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-xs truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
