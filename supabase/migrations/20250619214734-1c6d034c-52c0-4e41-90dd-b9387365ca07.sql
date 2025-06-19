
-- Create session_contexts table for structured relationship data
CREATE TABLE public.session_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  relationship_duration TEXT,
  communication_style TEXT,
  personality_traits JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  challenges JSONB DEFAULT '[]'::jsonb,
  previous_attempts JSONB DEFAULT '[]'::jsonb,
  context_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_up_triggers table for AI-generated follow-up questions
CREATE TABLE public.follow_up_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL, -- 'outcome_check', 'progress_update', 'reaction_inquiry'
  question_text TEXT NOT NULL,
  context_reference JSONB DEFAULT '{}'::jsonb,
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_interaction_patterns table for learning what works
CREATE TABLE public.user_interaction_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  pattern_type TEXT NOT NULL, -- 'communication_preference', 'success_strategy', 'timing_preference'
  pattern_data JSONB NOT NULL,
  success_rate DECIMAL(3,2) DEFAULT 0.00,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create relationship_profiles table for deep context about each relationship
CREATE TABLE public.relationship_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  current_status TEXT,
  key_insights JSONB DEFAULT '[]'::jsonb,
  communication_patterns JSONB DEFAULT '{}'::jsonb,
  successful_strategies JSONB DEFAULT '[]'::jsonb,
  areas_of_concern JSONB DEFAULT '[]'::jsonb,
  personality_assessment JSONB DEFAULT '{}'::jsonb,
  interaction_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for session_contexts
ALTER TABLE public.session_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session contexts" 
  ON public.session_contexts 
  FOR SELECT 
  USING (
    session_id IN (
      SELECT cs.id FROM public.coaching_sessions cs
      JOIN public.targets t ON cs.target_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own session contexts" 
  ON public.session_contexts 
  FOR INSERT 
  WITH CHECK (
    session_id IN (
      SELECT cs.id FROM public.coaching_sessions cs
      JOIN public.targets t ON cs.target_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own session contexts" 
  ON public.session_contexts 
  FOR UPDATE 
  USING (
    session_id IN (
      SELECT cs.id FROM public.coaching_sessions cs
      JOIN public.targets t ON cs.target_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- Add RLS policies for follow_up_triggers
ALTER TABLE public.follow_up_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follow-up triggers" 
  ON public.follow_up_triggers 
  FOR SELECT 
  USING (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own follow-up triggers" 
  ON public.follow_up_triggers 
  FOR INSERT 
  WITH CHECK (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own follow-up triggers" 
  ON public.follow_up_triggers 
  FOR UPDATE 
  USING (
    target_id IN (
      SELECT id FROM public.targets WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for user_interaction_patterns
ALTER TABLE public.user_interaction_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interaction patterns" 
  ON public.user_interaction_patterns 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own interaction patterns" 
  ON public.user_interaction_patterns 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interaction patterns" 
  ON public.user_interaction_patterns 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Add RLS policies for relationship_profiles
ALTER TABLE public.relationship_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own relationship profiles" 
  ON public.relationship_profiles 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own relationship profiles" 
  ON public.relationship_profiles 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own relationship profiles" 
  ON public.relationship_profiles 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Add enhanced metadata columns to coaching_sessions
ALTER TABLE public.coaching_sessions 
ADD COLUMN session_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN anticipatory_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN follow_up_generated BOOLEAN DEFAULT false;

-- Create function to generate follow-up triggers
CREATE OR REPLACE FUNCTION public.generate_follow_up_triggers(session_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  session_record RECORD;
  suggestion_record RECORD;
BEGIN
  -- Get session data
  SELECT * INTO session_record
  FROM public.coaching_sessions cs
  JOIN public.targets t ON cs.target_id = t.id
  WHERE cs.id = session_id_param;
  
  IF session_record.status = 'complete' AND session_record.strategist_output IS NOT NULL THEN
    -- Generate outcome check triggers for each suggestion
    FOR suggestion_record IN
      SELECT value as suggestion
      FROM jsonb_array_elements(session_record.strategist_output->'suggestions')
    LOOP
      INSERT INTO public.follow_up_triggers (
        session_id,
        target_id,
        trigger_type,
        question_text,
        context_reference
      ) VALUES (
        session_id_param,
        session_record.target_id,
        'outcome_check',
        'How did it go when you tried: ' || (suggestion_record.suggestion->>'title') || '?',
        jsonb_build_object('suggestion', suggestion_record.suggestion)
      );
    END LOOP;
    
    -- Mark follow-up as generated
    UPDATE public.coaching_sessions 
    SET follow_up_generated = true 
    WHERE id = session_id_param;
  END IF;
END;
$function$;

-- Create trigger to auto-generate follow-ups when session completes
CREATE OR REPLACE FUNCTION public.handle_session_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
    PERFORM public.generate_follow_up_triggers(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_session_complete
  AFTER UPDATE ON public.coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_session_completion();
