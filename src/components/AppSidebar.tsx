import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Heart, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Bell,
  CreditCard
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
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Load real counts with better error handling
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
      icon: Heart,
      isActive: location.pathname === '/dashboard'
    },
    { 
      path: '/clients', 
      label: 'Conversations', 
      icon: MessageSquare,
      isActive: location.pathname === '/clients' || location.pathname.startsWith('/chat/'),
      badge: loadingCounts ? '...' : (clientCount > 0 ? clientCount.toString() : undefined)
    },
    { 
      path: '/analytics', 
      label: 'Insights', 
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

  if (!user) return null;

  return (
    <Sidebar className="warm-sidebar border-sage-200 dark:border-charcoal-700">
      <SidebarHeader className="border-b border-sage-200 dark:border-charcoal-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center shadow-soft">
            <Heart className="w-6 h-6 text-teal-700 dark:text-teal-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-serif font-bold warm-text truncate">
              Coaching Suite
            </h2>
            <p className="text-xs warm-text-muted truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            <SidebarTrigger className="warm-text-muted hover:warm-text" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      className={`w-full justify-start transition-all duration-300 rounded-lg ${
                        item.isActive 
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 shadow-soft border-l-2 border-teal-600' 
                          : 'warm-text-muted hover:bg-sage-50 dark:hover:bg-charcoal-700 hover:warm-text'
                      }`}
                    >
                      <button onClick={() => navigate(item.path)} className="flex items-center space-x-3 w-full">
                        <Icon size={18} />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto bg-sage-100 dark:bg-charcoal-700 warm-text text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sage-200 dark:border-charcoal-700 p-3 space-y-2">
        {/* Notifications */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start warm-text-muted hover:warm-text hover:bg-sage-50 dark:hover:bg-charcoal-700 transition-all duration-300"
            >
              <Bell size={18} className="mr-3" />
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="ml-auto bg-terracotta-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 warm-gradient border-sage-200 dark:border-charcoal-700 z-[100]">
            <SheetHeader>
              <SheetTitle className="warm-text font-serif">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs warm-text-accent hover:warm-text w-fit"
                >
                  Mark all read
                </Button>
              )}
            </SheetHeader>
            <div className="mt-6 space-y-3 max-h-96 overflow-y-auto warm-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center warm-text-muted py-8">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-sage-400" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                      !notification.is_read 
                        ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/30 warm-hover' 
                        : 'warm-card hover:shadow-soft'
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium warm-text truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs warm-text-muted mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs warm-text-muted mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <SidebarMenuButton asChild>
          <button
            onClick={() => navigate('/profile')}
            className="w-full justify-start warm-text-muted hover:warm-text hover:bg-sage-50 dark:hover:bg-charcoal-700 transition-all duration-300"
          >
            <User size={18} className="mr-3" />
            <span className="font-medium">Profile</span>
          </button>
        </SidebarMenuButton>

        <SidebarMenuButton asChild>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full justify-start warm-text-muted hover:warm-text hover:bg-sage-50 dark:hover:bg-charcoal-700 transition-all duration-300"
          >
            <CreditCard size={18} className="mr-3" />
            <span className="font-medium">Subscription</span>
          </button>
        </SidebarMenuButton>

        <SidebarMenuButton asChild>
          <button
            onClick={() => navigate('/settings')}
            className="w-full justify-start warm-text-muted hover:warm-text hover:bg-sage-50 dark:hover:bg-charcoal-700 transition-all duration-300"
          >
            <Settings size={18} className="mr-3" />
            <span className="font-medium">Settings</span>
          </button>
        </SidebarMenuButton>

        <SidebarMenuButton asChild>
          <button
            onClick={handleSignOut}
            className="w-full justify-start text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 dark:hover:text-terracotta-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/10 transition-all duration-300"
          >
            <LogOut size={18} className="mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
};
