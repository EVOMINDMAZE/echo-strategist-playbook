
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSupabaseCoaching } from '@/hooks/useSupabaseCoaching';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Home,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  User,
  LogOut,
  Star,
  Calendar,
  FileText,
  Zap,
  Crown,
  Shield
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface WorldClassNavigationProps {
  user: SupabaseUser | null;
}

export const WorldClassNavigation = ({ user }: WorldClassNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead } = useSupabaseCoaching();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const userMenuItems = [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/subscription', label: 'Billing & Plans', icon: CreditCard },
  ];

  const quickActions = [
    { path: '/clients', label: 'New Client', icon: Users },
    { path: '/targets', label: 'Quick Session', icon: MessageSquare },
    { path: '/analytics', label: 'View Analytics', icon: BarChart3 },
  ];

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === 'session') {
      navigate('/clients');
    }
  };

  if (!user) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                CoachAI
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                CoachAI Pro
              </span>
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Enterprise</span>
              </div>
            </div>
          </Link>

          {/* Main Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavigationMenuItem key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </NavigationMenuItem>
                );
              })}

              {/* Quick Actions Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Zap size={18} />
                  <span className="font-medium">Quick Actions</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-6 w-80">
                  <div className="grid gap-3">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 mb-1">Quick Actions</h3>
                      <p className="text-sm text-gray-600">Jump to common tasks</p>
                    </div>
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.path}
                          to={action.path}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                            <Icon size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{action.label}</div>
                            <div className="text-sm text-gray-500">Quick access</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="p-4 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="w-full">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"></div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="font-medium text-sm text-gray-900">
                      {user.user_metadata?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">Pro Plan</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <div className="font-medium">{user.user_metadata?.full_name || 'User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center space-x-2">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
