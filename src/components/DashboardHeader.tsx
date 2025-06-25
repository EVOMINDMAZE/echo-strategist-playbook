
import { User } from '@supabase/supabase-js';

interface DashboardHeaderProps {
  user: User;
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  return (
    <div className="mb-6 sm:mb-8 animate-fade-in-up">
      <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
        Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Coach'}! 👋
      </h1>
      <p className="mt-2 text-lg sm:text-xl text-muted-foreground">
        Ready to make today's coaching sessions impactful?
      </p>
    </div>
  );
};
