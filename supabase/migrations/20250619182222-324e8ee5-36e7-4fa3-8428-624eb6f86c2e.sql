
-- Add favorites functionality
ALTER TABLE public.targets ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;

-- Create notifications table for real notification system
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'reminder'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add session continuation support
ALTER TABLE public.coaching_sessions ADD COLUMN is_continued BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coaching_sessions ADD COLUMN parent_session_id UUID REFERENCES public.coaching_sessions(id);

-- Create user preferences table for settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  session_reminders BOOLEAN DEFAULT TRUE,
  coaching_style TEXT DEFAULT 'balanced', -- 'direct', 'empathetic', 'analytical', 'balanced'
  preferred_session_length INTEGER DEFAULT 30, -- minutes
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for user preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create default preferences when user signs up
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_preferences();
