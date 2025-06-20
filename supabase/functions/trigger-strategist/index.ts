
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Trigger Strategist Function Started ===');
    
    const { sessionId } = await req.json()
    console.log('Processing session:', sessionId);

    if (!sessionId) {
      console.error('Missing sessionId');
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update session status to analyzing
    console.log('Updating session status to analyzing...');
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({ status: 'analyzing' })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to update session status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update session status', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch session data with target information
    console.log('Fetching session data...');
    const { data: sessionData, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        targets (
          target_name,
          user_id
        )
      `)
      .eq('id', sessionId)
      .single()

    if (fetchError || !sessionData) {
      console.error('Failed to fetch session data:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch session data', details: fetchError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Session data loaded, message count:', sessionData.raw_chat_history?.length || 0);

    // Prepare conversation history for analysis
    const messages = sessionData.raw_chat_history || []
    const conversationText = messages
      .map((msg: any) => `${msg.sender}: ${msg.content}`)
      .join('\n\n')

    if (conversationText.length < 50) {
      console.log('Conversation too short for analysis');
      // Revert status
      await supabase
        .from('coaching_sessions')
        .update({ status: 'gathering_info' })
        .eq('id', sessionId)

      return new Response(
        JSON.stringify({ error: 'Conversation too short for meaningful analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced strategist prompt with actionable reply examples
    const strategistPrompt = `You are an expert relationship strategist and communication coach. Analyze this conversation and provide personalized, actionable strategies with concrete reply examples.

CONVERSATION TO ANALYZE:
${conversationText}

TARGET PERSON: ${sessionData.targets?.target_name || 'Unknown'}

Please provide a comprehensive analysis in the following JSON format. Make sure your strategic recommendations include specific, copy-paste reply examples:

{
  "relationship_summary": "2-3 sentence summary of the relationship dynamic and main challenges",
  "key_insights": [
    "Insight 1 about communication patterns or emotional dynamics",
    "Insight 2 about underlying issues or opportunities", 
    "Insight 3 about what's working well or areas for improvement"
  ],
  "strategic_recommendations": [
    {
      "strategy_title": "Clear, actionable strategy name",
      "explanation": "2-3 sentence explanation of this communication approach and when to use it",
      "reply_example": "Exact text the user can copy and send (tailored to their situation and conversation style)",
      "why_it_works": "Psychological insight explaining why this approach is effective for this specific relationship dynamic",
      "timing_advice": "When and how to use this strategy for maximum impact"
    },
    {
      "strategy_title": "Second strategy name",
      "explanation": "Detailed explanation of this approach",
      "reply_example": "Another specific, ready-to-use message example",
      "why_it_works": "Psychology behind why this works for their situation",
      "timing_advice": "Optimal timing and context for this strategy"
    },
    {
      "strategy_title": "Third strategy name",
      "explanation": "Comprehensive explanation of this technique",
      "reply_example": "Third concrete message example they can use",
      "why_it_works": "Deep insight into the effectiveness of this approach",
      "timing_advice": "Strategic timing recommendations"
    }
  ],
  "conversation_starters": [
    "Natural conversation starter 1 that rebuilds connection",
    "Thoughtful conversation starter 2 that addresses underlying issues",
    "Positive conversation starter 3 that moves the relationship forward"
  ],
  "potential_obstacles": [
    {
      "obstacle": "Most likely challenge they might face",
      "solution": "Specific strategy to overcome this challenge"
    },
    {
      "obstacle": "Second potential roadblock",
      "solution": "Practical approach to handle this situation"
    }
  ],
  "success_indicators": [
    "Sign 1 that the strategies are working",
    "Sign 2 of improved communication",
    "Sign 3 of relationship progress"
  ],
  "follow_up_timeline": "Suggested timeline for checking progress and adjusting approach (e.g., '2-3 days to try initial strategies, then reassess')"
}

CRITICAL REQUIREMENTS:
- Make reply examples specific to their conversation style and situation
- Ensure strategies are immediately actionable, not theoretical
- Tailor psychological insights to their specific relationship dynamic
- Provide concrete, practical guidance they can implement today`

    console.log('Sending analysis request to OpenAI...');

    // Call OpenAI for strategist analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: strategistPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorData);
      
      // Revert session status
      await supabase
        .from('coaching_sessions')
        .update({ status: 'gathering_info' })
        .eq('id', sessionId)

      return new Response(
        JSON.stringify({ error: 'Failed to generate strategic analysis', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await openaiResponse.json()
    console.log('OpenAI response received, usage:', aiResponse.usage);

    let strategistOutput
    try {
      const responseContent = aiResponse.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No content in OpenAI response')
      }
      
      console.log('Raw OpenAI response content length:', responseContent.length);
      
      // Clean up the response content before parsing
      let cleanContent = responseContent.trim()
      
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      strategistOutput = JSON.parse(cleanContent)
      console.log('Successfully parsed strategist output with keys:', Object.keys(strategistOutput));
    } catch (parseError) {
      console.error('Failed to parse strategist output:', parseError);
      console.error('Raw content:', aiResponse.choices[0]?.message?.content);
      
      // Revert session status
      await supabase
        .from('coaching_sessions')
        .update({ status: 'gathering_info' })
        .eq('id', sessionId)

      return new Response(
        JSON.stringify({ error: 'Failed to parse strategic analysis', details: parseError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update session with strategist output and mark as complete
    console.log('Updating session with strategist output...');
    const { error: saveError } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'complete',
        strategist_output: strategistOutput
      })
      .eq('id', sessionId)

    if (saveError) {
      console.error('Failed to save strategist output:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save strategic analysis', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Trigger Strategist Function Completed Successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Strategic analysis completed successfully',
        sessionId,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== Trigger Strategist Function Error ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
