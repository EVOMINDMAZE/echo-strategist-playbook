
import { useClients } from './useClients';
import { useNotifications } from './useNotifications';
import { useCoachingSessions } from './useCoachingSessions';

export type { Client, ChatMessage, SessionStatus, SessionData } from '@/types/coaching';

export const useSupabaseCoaching = () => {
  const clientsHook = useClients();
  const notificationsHook = useNotifications();
  const sessionsHook = useCoachingSessions();

  return {
    ...clientsHook,
    ...notificationsHook,
    ...sessionsHook
  };
};
