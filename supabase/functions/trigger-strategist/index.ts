
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategistRequest {
  sessionId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId }: StrategistRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select('*, target:targets(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Extract user responses from chat history
    const userMessages = session.raw_chat_history?.filter((msg: any) => msg.sender === 'user') || [];
    const targetName = session.target?.target_name || 'this person';

    // Create prompt for strategist
    const prompt = `You are an expert conversational strategist. Based on the following conversation context, provide strategic advice.

Target: ${targetName}
User responses: ${userMessages.map((msg: any, i: number) => `${i + 1}. ${msg.content}`).join('\n')}

Provide a strategic analysis and 3-4 specific, actionable suggestions. Format your response as JSON with this structure:
{
  "analysis": "Your strategic analysis paragraph",
  "suggestions": [
    {
      "title": "Suggestion title",
      "description": "What to do",
      "why_it_works": "Why this approach is effective"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a dating and relationship strategist. Provide personalized, actionable advice.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const strategistOutput = JSON.parse(completion.choices[0].message.content || '{}');

    // Update session with strategist output
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        strategist_output: strategistOutput,
        status: 'complete'
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error('Failed to update session with strategist output');
    }

    return new Response(JSON.stringify({ success: true, strategistOutput }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in trigger-strategist:', error);
    
    // Update session status to error
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const { sessionId } = await req.json();
      await supabase
        .from('coaching_sessions')
        .update({ status: 'error' })
        .eq('id', sessionId);
    } catch (e) {
      console.error('Failed to update session status to error:', e);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
