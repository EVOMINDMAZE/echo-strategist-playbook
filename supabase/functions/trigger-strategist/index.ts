
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

    // Enhanced strategist prompt with better structure and completeness
    const strategistPrompt = `You are an expert relationship strategist and communication coach. Analyze this conversation and provide personalized, actionable strategies.

CONVERSATION TO ANALYZE:
${conversationText}

TARGET PERSON: ${sessionData.targets?.target_name || 'Unknown'}

Please provide a comprehensive analysis in the following JSON format. Ensure your response is complete and well-structured:

{
  "relationship_summary": "2-3 sentence summary of the relationship dynamic and main challenges",
  "key_insights": [
    "Insight 1 about communication patterns",
    "Insight 2 about emotional dynamics", 
    "Insight 3 about underlying issues"
  ],
  "communication_strategies": [
    {
      "title": "Strategy 1 Title",
      "description": "Detailed explanation of this approach",
      "specific_phrases": ["Exact phrase 1", "Exact phrase 2"],
      "when_to_use": "Specific situations when this strategy is most effective",
      "expected_outcome": "What to expect when using this strategy"
    },
    {
      "title": "Strategy 2 Title", 
      "description": "Detailed explanation of this approach",
      "specific_phrases": ["Exact phrase 1", "Exact phrase 2"],
      "when_to_use": "Specific situations when this strategy is most effective",
      "expected_outcome": "What to expect when using this strategy"
    },
    {
      "title": "Strategy 3 Title",
      "description": "Detailed explanation of this approach", 
      "specific_phrases": ["Exact phrase 1", "Exact phrase 2"],
      "when_to_use": "Specific situations when this strategy is most effective",
      "expected_outcome": "What to expect when using this strategy"
    }
  ],
  "conversation_starters": [
    "Conversation starter 1 with context",
    "Conversation starter 2 with context",
    "Conversation starter 3 with context"
  ],
  "potential_obstacles": [
    {
      "obstacle": "Potential challenge 1",
      "solution": "How to overcome this challenge"
    },
    {
      "obstacle": "Potential challenge 2", 
      "solution": "How to overcome this challenge"
    }
  ],
  "success_indicators": [
    "Sign 1 that the strategy is working",
    "Sign 2 that the strategy is working",
    "Sign 3 that the strategy is working"
  ],
  "follow_up_timeline": "Suggested timeline for checking progress and adjusting approach"
}

CRITICAL: Provide a complete, valid JSON response. Ensure all strategies are specific, actionable, and tailored to this relationship dynamic.`

    console.log('Sending analysis request to OpenAI...');

    // Call OpenAI for strategist analysis with increased timeout and better error handling
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: strategistPrompt }
        ],
        max_tokens: 2500, // Increased for complete responses
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
