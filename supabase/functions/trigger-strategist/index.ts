
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

    console.log('Triggering strategist analysis for session:', sessionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI with upgraded model
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
      console.error('Session not found:', sessionError);
      throw new Error('Session not found');
    }

    console.log('Session found, analyzing conversation...');

    // Extract user responses from chat history
    const userMessages = session.raw_chat_history?.filter((msg: any) => msg.sender === 'user') || [];
    const aiMessages = session.raw_chat_history?.filter((msg: any) => msg.sender === 'ai') || [];
    const targetName = session.target?.target_name || 'this person';

    // Create comprehensive context for strategist
    const conversationContext = session.raw_chat_history?.map((msg: any) => 
      `${msg.sender.toUpperCase()}: ${msg.content}`
    ).join('\n') || '';

    const prompt = `You are an expert dating and relationship strategist. Analyze this coaching conversation and provide strategic insights and actionable advice.

CONVERSATION CONTEXT:
Target: ${targetName}
Full Conversation:
${conversationContext}

ANALYSIS INSTRUCTIONS:
1. Analyze the user's situation, goals, and personality based on the conversation
2. Identify key challenges and opportunities in their dynamic with ${targetName}
3. Provide 3-4 specific, actionable strategies tailored to their situation
4. Make suggestions practical and achievable

Format your response as JSON with this exact structure:
{
  "analysis": "A thoughtful analysis paragraph about their situation, what you've learned about them, and the key dynamics at play with ${targetName}",
  "suggestions": [
    {
      "title": "Clear, actionable suggestion title",
      "description": "Specific instructions on what to do and how to do it",
      "why_it_works": "Psychology-backed explanation of why this approach will be effective for their specific situation"
    }
  ]
}

Focus on practical advice that fits their personality and situation. Be specific rather than generic.`;

    console.log('Calling OpenAI for strategist analysis...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { 
          role: 'system', 
          content: 'You are a world-class dating and relationship strategist. Provide personalized, actionable advice based on the conversation context.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseContent = completion.choices[0].message.content;
    console.log('OpenAI response:', responseContent);

    let strategistOutput;
    try {
      strategistOutput = JSON.parse(responseContent || '{}');
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback response
      strategistOutput = {
        analysis: "I've analyzed your conversation and can see you're looking for guidance in your relationship with " + targetName + ". Based on what you've shared, there are several strategic approaches we can take.",
        suggestions: [
          {
            title: "Build Connection",
            description: "Focus on creating meaningful conversations that show your genuine interest in their thoughts and feelings.",
            why_it_works: "Authentic connection forms the foundation of any strong relationship and helps establish trust."
          }
        ]
      };
    }

    console.log('Parsed strategist output:', strategistOutput);

    // Update session with strategist output
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        strategist_output: strategistOutput,
        status: 'complete'
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session with strategist output:', updateError);
      throw new Error('Failed to update session with strategist output');
    }

    console.log('Session updated with strategist output');

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
      console.log('Session status updated to error');
    } catch (e) {
      console.error('Failed to update session status to error:', e);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
