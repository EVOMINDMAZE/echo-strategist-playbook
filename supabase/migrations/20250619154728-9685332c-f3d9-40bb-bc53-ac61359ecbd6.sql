
-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create contact submissions table
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contact submissions (admin only)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create session summaries table
CREATE TABLE public.session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  summary TEXT,
  tone_analysis JSONB,
  key_insights TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on session summaries
ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view summaries of their sessions" ON public.session_summaries
  FOR SELECT USING (
    session_id IN (
      SELECT cs.id FROM public.coaching_sessions cs
      JOIN public.targets t ON cs.target_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user profile updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update existing tables to have better RLS policies
DROP POLICY IF EXISTS "Users can view their own coaching sessions" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Users can create coaching sessions for their targets" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Users can update their own coaching sessions" ON public.coaching_sessions;

CREATE POLICY "Users can view their own coaching sessions" ON public.coaching_sessions
  FOR SELECT USING (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create coaching sessions for their targets" ON public.coaching_sessions
  FOR INSERT WITH CHECK (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own coaching sessions" ON public.coaching_sessions
  FOR UPDATE USING (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

-- Function to get user's session analytics
CREATE OR REPLACE FUNCTION public.get_user_session_analytics(user_id_param UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  total_targets BIGINT,
  avg_session_duration INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN cs.status = 'complete' THEN 1 END) as completed_sessions,
    COUNT(DISTINCT t.id) as total_targets,
    AVG(CASE WHEN cs.status = 'complete' THEN EXTRACT(EPOCH FROM (cs.created_at - cs.created_at)) END) * INTERVAL '1 second' as avg_session_duration
  FROM public.coaching_sessions cs
  JOIN public.targets t ON cs.target_id = t.id
  WHERE t.user_id = user_id_param;
END;
$$;
