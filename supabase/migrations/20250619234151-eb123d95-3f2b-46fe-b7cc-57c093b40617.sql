
-- Create table to store smart reply suggestions and their usage
CREATE TABLE public.smart_reply_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  target_id uuid REFERENCES public.targets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  suggestion_text text NOT NULL,
  suggestion_type text NOT NULL, -- 'getting_started', 'adding_context', 'specific_details', 'ready_for_analysis'
  context_data jsonb DEFAULT '{}',
  message_count integer NOT NULL,
  last_ai_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table to track when suggestions are selected/used
CREATE TABLE public.suggestion_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES public.smart_reply_suggestions(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  target_id uuid REFERENCES public.targets(id) ON DELETE CASCADE,
  selected_at timestamp with time zone DEFAULT now(),
  was_effective boolean, -- To be updated based on session outcome
  follow_up_context jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_reply_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for smart_reply_suggestions
CREATE POLICY "Users can view their own suggestions"
  ON public.smart_reply_suggestions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own suggestions"
  ON public.smart_reply_suggestions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS policies for suggestion_interactions
CREATE POLICY "Users can view their own interactions"
  ON public.suggestion_interactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own interactions"
  ON public.suggestion_interactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own interactions"
  ON public.suggestion_interactions FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX idx_smart_reply_suggestions_session ON public.smart_reply_suggestions(session_id);
CREATE INDEX idx_smart_reply_suggestions_target ON public.smart_reply_suggestions(target_id, user_id);
CREATE INDEX idx_suggestion_interactions_session ON public.suggestion_interactions(session_id);
CREATE INDEX idx_suggestion_interactions_target ON public.suggestion_interactions(target_id, user_id);
