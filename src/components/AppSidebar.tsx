
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
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
    <Sidebar className="border-r border-gray-200" collapsible="icon">
      <SidebarHeader className="border-b border-gray-100 p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              Coaching Suite
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
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
                      className={`w-full justify-start transition-colors rounded-lg relative ${
                        item.isActive 
                          ? 'bg-blue-600 text-white font-medium hover:bg-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className="flex items-center w-full px-3 py-2.5 group-data-[collapsible=icon]:justify-center"
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="font-medium ml-3 group-data-[collapsible=icon]:sr-only">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto text-xs bg-gray-100 text-gray-600 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:bg-red-500 group-data-[collapsible=icon]:text-white"
                          >
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

      <SidebarFooter className="border-t border-gray-100 p-2 space-y-1">
        {/* Notifications */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:bg-gray-100 px-3 py-2 relative group-data-[collapsible=icon]:justify-center"
            >
              <Bell size={16} className="flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
              <span className="font-medium text-sm ml-3 group-data-[collapsible=icon]:sr-only">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="ml-auto bg-red-600 text-white text-xs group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs w-fit"
                >
                  Mark all read
                </Button>
              )}
            </SheetHeader>
            <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      !notification.is_read 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="w-full justify-start text-gray-700 hover:bg-gray-100 px-3 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <User size={16} className="flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
          <span className="font-medium text-sm ml-3 group-data-[collapsible=icon]:sr-only">Profile</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate('/subscription')}
          className="w-full justify-start text-gray-700 hover:bg-gray-100 px-3 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <CreditCard size={16} className="flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
          <span className="font-medium text-sm ml-3 group-data-[collapsible=icon]:sr-only">Subscription</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="w-full justify-start text-gray-700 hover:bg-gray-100 px-3 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <Settings size={16} className="flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
          <span className="font-medium text-sm ml-3 group-data-[collapsible=icon]:sr-only">Settings</span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-red-600 hover:bg-red-50 px-3 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <LogOut size={16} className="flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
          <span className="font-medium text-sm ml-3 group-data-[collapsible=icon]:sr-only">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
