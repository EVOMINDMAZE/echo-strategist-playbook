
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
  Zap,
  Menu,
  X
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load real counts with better error handling
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) {
        setClientCount(0);
        setNotificationCount(0);
        setLoadingCounts(false);
        return;
      }
      
      try {
        // Load client count with proper error handling
        const { data: targets, error: targetsError } = await supabase
          .from('targets')
          .select('id')
          .eq('user_id', user.id);
        
        if (targetsError) {
          console.error('Error loading client count:', targetsError);
          setClientCount(0);
        } else {
          setClientCount(targets?.length || 0);
        }

        // Load notification count
        const { data: notifications, error: notificationsError } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (notificationsError) {
          console.error('Error loading notification count:', notificationsError);
          setNotificationCount(0);
        } else {
          setNotificationCount(notifications?.length || 0);
        }
      } catch (error) {
        console.error('Error loading counts:', error);
        setClientCount(0);
        setNotificationCount(0);
      } finally {
        setLoadingCounts(false);
      }
    };

    loadCounts();

    // Set up real-time updates for both targets and notifications
    if (user) {
      const targetsChannel = supabase
        .channel('targets-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'targets', filter: `user_id=eq.${user.id}` },
          () => {
            console.log('Targets changed, reloading counts...');
            loadCounts();
          }
        )
        .subscribe();

      const notificationsChannel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            console.log('Notifications changed, reloading counts...');
            loadCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(targetsChannel);
        supabase.removeChannel(notificationsChannel);
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
      badge: loadingCounts ? '...' : (clientCount > 0 ? clientCount.toString() : undefined)
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
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo section - responsive */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 sm:space-x-2 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
              <span className="hidden sm:block">Coaching Assistant</span>
              <span className="sm:hidden text-sm">Coach</span>
            </button>
          </div>

          {/* Desktop Navigation - centered with proper spacing */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-lg mx-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={item.isActive ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className={`relative flex items-center space-x-2 transition-all duration-200 text-sm whitespace-nowrap px-3 py-2 ${
                      item.isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 text-xs min-w-[20px] h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Right section - responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {user && (
              <>
                {/* Search - hidden on small screens */}
                <form onSubmit={handleQuickSearch} className="hidden xl:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-36 lg:w-48"
                    />
                  </div>
                </form>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell size={16} />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </Button>

                <ThemeToggle />

                {/* User section - responsive */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="hidden lg:block text-right min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-32">
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
                      className="hover:bg-blue-50 h-8 w-8"
                    >
                      <User size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/settings')}
                      className="hover:bg-blue-50 h-8 w-8"
                    >
                      <Settings size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="hover:bg-red-50 hover:text-red-600 h-8 w-8"
                    >
                      <LogOut size={14} />
                    </Button>
                  </div>
                </div>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden h-9 w-9"
                >
                  {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                </Button>
              </>
            )}

            {!user && (
              <Button onClick={() => navigate('/auth')} size="sm">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile navigation items */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={item.isActive ? "default" : "ghost"}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start space-x-2 ${
                    item.isActive ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
            
            {/* Mobile user actions */}
            <div className="pt-2 mt-2 border-t border-gray-200 space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start space-x-2"
              >
                <User size={16} />
                <span>Profile</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/settings');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start space-x-2"
              >
                <Settings size={16} />
                <span>Settings</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start space-x-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
