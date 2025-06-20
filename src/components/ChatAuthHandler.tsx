
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ChatAuthHandlerProps {
  onUserLoad: (user: User | null) => void;
  onError: (error: string) => void;
}

export const ChatAuthHandler = ({ onUserLoad, onError }: ChatAuthHandlerProps) => {
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (!authSession) {
          console.log('No auth session, redirecting to auth');
          window.location.href = '/auth';
          return;
        }
        onUserLoad(authSession.user);
        console.log('User authenticated:', authSession.user.id);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) onError('Authentication failed');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (session) {
          onUserLoad(session.user);
        } else {
          window.location.href = '/auth';
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onUserLoad, onError]);

  return null; // This is a logic-only component
};
