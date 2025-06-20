
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Bell,
  Zap,
  Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useNotifications } from '@/hooks/useNotifications';

interface AppSidebarProps {
  user: SupabaseUser | null;
}

export const AppSidebar = ({ user }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientCount, setClientCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Load real counts
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) {
        setClientCount(0);
        setLoadingCounts(false);
        return;
      }
      
      try {
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
      } catch (error) {
        console.error('Error loading counts:', error);
        setClientCount(0);
      } finally {
        setLoadingCounts(false);
      }
    };

    loadCounts();

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

      return () => {
        supabase.removeChannel(targetsChannel);
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
      label: 'Coaching Sessions', 
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

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  if (!user) {
    return (
      <Sidebar>
        <SidebarHeader className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Coaching Suite
              </h2>
              <p className="text-xs text-slate-400">Professional Edition</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <div className="text-center py-8">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Get Started
            </Button>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r border-slate-800/50">
      <SidebarHeader className="p-6 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent truncate">
              Coaching Suite
            </h2>
            <p className="text-xs text-slate-400">Professional Edition</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={item.isActive}
                      className={`group relative flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                        item.isActive 
                          ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border border-purple-500/30' 
                          : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={item.isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-white'} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6 bg-slate-800/50" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium mb-3">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <div className="relative">
                  <SidebarMenuButton
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all duration-200 w-full"
                  >
                    <Bell size={18} className="text-slate-400 group-hover:text-white" />
                    <span className="font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-red-600 text-white text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                  
                  {showNotifications && (
                    <div className="absolute left-full top-0 ml-4 w-80 bg-slate-900 rounded-lg shadow-xl border border-slate-800 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 ${
                                !notification.is_read ? 'bg-purple-600/10' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-white truncate">
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/profile')}
                  isActive={location.pathname === '/profile'}
                  className={`group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    location.pathname === '/profile'
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border border-purple-500/30' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <User size={18} className={location.pathname === '/profile' ? 'text-purple-400' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium">Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/settings')}
                  isActive={location.pathname === '/settings'}
                  className={`group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    location.pathname === '/settings'
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border border-purple-500/30' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Settings size={18} className={location.pathname === '/settings' ? 'text-purple-400' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <div className="text-xs text-slate-400">
                  Professional Coach
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start space-x-2 text-slate-300 hover:text-red-400 hover:bg-red-950/30"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
      
      {/* Overlay to close notifications when clicking outside */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </Sidebar>
  );
};
