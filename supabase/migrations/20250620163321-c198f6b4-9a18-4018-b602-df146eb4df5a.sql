
-- Enhance session_summaries table to support incremental insights
ALTER TABLE public.session_summaries 
ADD COLUMN IF NOT EXISTS insight_type TEXT DEFAULT 'full_summary',
ADD COLUMN IF NOT EXISTS conversation_segment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extracted_patterns JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emotional_tone JSONB DEFAULT '{}';

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_session_summaries_session_id ON public.session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_relationship_profiles_target_id ON public.relationship_profiles(target_id);
CREATE INDEX IF NOT EXISTS idx_user_interaction_patterns_user_id ON public.user_interaction_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_effectiveness ON public.suggestion_interactions(was_effective, user_id);

-- Enhance relationship_profiles with learning data
ALTER TABLE public.relationship_profiles 
ADD COLUMN IF NOT EXISTS learning_confidence NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_pattern_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enhance user_interaction_patterns with more detailed tracking
ALTER TABLE public.user_interaction_patterns
ADD COLUMN IF NOT EXISTS interaction_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS effectiveness_history JSONB DEFAULT '[]';

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Learning functions can read session summaries" ON public.session_summaries;
DROP POLICY IF EXISTS "Learning functions can insert session summaries" ON public.session_summaries;
DROP POLICY IF EXISTS "Learning functions can update profiles" ON public.relationship_profiles;
DROP POLICY IF EXISTS "Learning functions can update patterns" ON public.user_interaction_patterns;

-- Add RLS policies for new learning functions
CREATE POLICY "Learning functions can read session summaries" 
ON public.session_summaries FOR SELECT 
USING (true);

CREATE POLICY "Learning functions can insert session summaries" 
ON public.session_summaries FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Learning functions can update profiles" 
ON public.relationship_profiles FOR ALL 
USING (true);

CREATE POLICY "Learning functions can update patterns" 
ON public.user_interaction_patterns FOR ALL 
USING (true);
