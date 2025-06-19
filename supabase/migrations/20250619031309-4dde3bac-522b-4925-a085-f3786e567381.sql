
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create targets table
CREATE TABLE public.targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index on user_id for performance
CREATE INDEX idx_targets_user_id ON public.targets(user_id);

-- Create coaching_sessions table
CREATE TABLE public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'gathering_info' NOT NULL,
  raw_chat_history JSONB DEFAULT '[]'::jsonb,
  case_file_data JSONB DEFAULT '{}'::jsonb,
  strategist_output JSONB,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index on target_id for performance
CREATE INDEX idx_coaching_sessions_target_id ON public.coaching_sessions(target_id);

-- Enable Row Level Security
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for targets table
CREATE POLICY "Users can view their own targets" ON public.targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own targets" ON public.targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targets" ON public.targets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own targets" ON public.targets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coaching_sessions table
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

-- Function to generate history summary
CREATE OR REPLACE FUNCTION public.generate_history_summary(target_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  history_text TEXT := '';
  session_record RECORD;
BEGIN
  -- Get all past sessions for the target, ordered by creation date
  FOR session_record IN
    SELECT 
      created_at,
      case_file_data,
      strategist_output,
      user_feedback,
      status
    FROM public.coaching_sessions
    WHERE target_id = target_id_param
    ORDER BY created_at ASC
  LOOP
    history_text := history_text || 
      'Session on ' || session_record.created_at::DATE || ': ' ||
      'Status: ' || session_record.status;
    
    -- Add case file summary if available
    IF session_record.case_file_data IS NOT NULL AND session_record.case_file_data != '{}'::jsonb THEN
      history_text := history_text || ' | Case: ' || session_record.case_file_data::TEXT;
    END IF;
    
    -- Add user feedback if available
    IF session_record.user_feedback IS NOT NULL THEN
      history_text := history_text || ' | Feedback: ' || session_record.user_feedback;
    END IF;
    
    history_text := history_text || E'\n';
  END LOOP;
  
  -- Return empty string if no history found
  IF history_text = '' THEN
    RETURN 'No previous sessions found.';
  END IF;
  
  RETURN history_text;
END;
$$;

-- Function to trigger strategist analysis (will be called by webhook)
CREATE OR REPLACE FUNCTION public.trigger_strategist_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be enhanced when we create the Edge Function
  -- For now, it just logs the status change
  RAISE NOTICE 'Session % status changed to analyzing', NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for when status changes to 'analyzing'
CREATE TRIGGER trigger_strategist_on_analyzing
  AFTER UPDATE OF status ON public.coaching_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'analyzing' AND OLD.status != 'analyzing')
  EXECUTE FUNCTION public.trigger_strategist_analysis();

-- Add check constraint for valid status values
ALTER TABLE public.coaching_sessions 
ADD CONSTRAINT valid_status_check 
CHECK (status IN ('gathering_info', 'analyzing', 'complete', 'error'));
