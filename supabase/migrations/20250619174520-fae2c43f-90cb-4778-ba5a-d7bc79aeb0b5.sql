
-- Add feedback collection columns to coaching_sessions table
ALTER TABLE public.coaching_sessions 
ADD COLUMN IF NOT EXISTS feedback_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS feedback_rating integer,
ADD COLUMN IF NOT EXISTS feedback_submitted_at timestamp with time zone;

-- Create a comprehensive feedback tracking table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  target_id uuid REFERENCES public.targets(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  suggestions_tried text[],
  outcome_rating integer CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
  what_worked_well text,
  what_didnt_work text,
  additional_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for user_feedback table
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own feedback"
  ON public.user_feedback FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_target 
ON public.user_feedback(user_id, target_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_session 
ON public.user_feedback(session_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_feedback_updated_at 
    BEFORE UPDATE ON public.user_feedback 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
