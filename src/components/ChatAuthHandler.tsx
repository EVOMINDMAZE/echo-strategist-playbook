
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ChatAuthHandlerProps {
  onUserLoad: (user: User | null) => void;
  onError: (error: string) => void;
}

export const ChatAuthHandler = ({ onUserLoad, onError }: ChatAuthHandlerProps) => {
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (!authSession) {
          console.log('No auth session found');
          onError('Authentication required');
          return;
        }
        
        onUserLoad(authSession.user);
        console.log('User authenticated successfully:', authSession.user.id);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) onError('Authentication failed');
      } finally {
        if (mounted) setHasCheckedAuth(true);
      }
    };

    // Only run once
    if (!hasCheckedAuth) {
      initAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          onUserLoad(session.user);
        } else if (event === 'SIGNED_OUT') {
          window.location.href = '/auth';
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onUserLoad, onError, hasCheckedAuth]);

  return null; // This is a logic-only component
};
