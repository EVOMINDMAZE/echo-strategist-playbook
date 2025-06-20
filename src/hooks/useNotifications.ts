
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for notifications
    const { data: { user } } = supabase.auth.getUser();
    user?.then((userData) => {
      if (userData.user) {
        const notificationsChannel = supabase
          .channel('notifications-realtime')
          .on('postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'notifications', 
              filter: `user_id=eq.${userData.user.id}` 
            },
            () => {
              console.log('Notifications changed, reloading...');
              loadNotifications();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(notificationsChannel);
        };
      }
    });
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const {  data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        // Create a sample notification if none exist for demo purposes
        if (error.code === 'PGRST116') { // No rows returned
          const sampleNotifications: Notification[] = [
            {
              id: 'sample-1',
              title: 'Welcome to Coaching Assistant!',
              message: 'Start your first coaching session to get personalized relationship insights.',
              type: 'info',
              is_read: false,
              created_at: new Date().toISOString()
            }
          ];
          setNotifications(sampleNotifications);
          setUnreadCount(1);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        // Map database types to our interface types
        const mappedNotifications: Notification[] = (data || []).map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: (['info', 'success', 'warning', 'error'].includes(notification.type) 
            ? notification.type 
            : 'info') as Notification['type'],
          is_read: notification.is_read || false,
          created_at: notification.created_at
        }));

        setNotifications(mappedNotifications);
        setUnreadCount(mappedNotifications.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // For sample notifications, just update local state
      if (notificationId.startsWith('sample-')) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For sample notifications, just update local state
      const hasSampleNotifications = notifications.some(n => n.id.startsWith('sample-'));
      if (hasSampleNotifications) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadNotifications
  };
};
