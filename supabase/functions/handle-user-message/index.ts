
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Handle User Message Function Started ===');
    
    // Get request data
    const { message, sessionId, previousMessages = [], userMessageCount = 0 } = await req.json()
    console.log('Request data:', { 
      messageLength: message?.length, 
      sessionId, 
      previousMessagesCount: previousMessages.length,
      userMessageCount 
    });

    // Validate required fields
    if (!message || !sessionId) {
      console.error('Missing required fields:', { message: !!message, sessionId: !!sessionId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message and sessionId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create dynamic system prompt based on conversation stage
    let systemPrompt = `You are an expert relationship coach specializing in interpersonal communication. Your role is to help users navigate challenging conversations and improve their relationships.

CONVERSATION STAGE: ${userMessageCount <= 3 ? 'INFORMATION GATHERING' : userMessageCount <= 6 ? 'EXPLORATION' : 'ANALYSIS PREPARATION'}

`;

    if (userMessageCount <= 3) {
      systemPrompt += `You are in the INFORMATION GATHERING stage. Focus on:
- Understanding the relationship dynamics
- Identifying the specific communication challenge
- Gathering context about the situation
- Asking clarifying questions to understand their perspective
- Being empathetic and supportive

Keep responses concise (2-3 sentences) and focus on one key question or insight at a time.`;
    } else if (userMessageCount <= 6) {
      systemPrompt += `You are in the EXPLORATION stage. Focus on:
- Diving deeper into the emotional aspects
- Understanding patterns in their communication
- Exploring what they've tried before
- Identifying their communication goals
- Helping them reflect on their own role in the dynamic

Provide more detailed insights but still ask follow-up questions.`;
    } else {
      systemPrompt += `You are in the ANALYSIS PREPARATION stage. Focus on:
- Synthesizing the information gathered
- Identifying key themes and patterns
- Preparing for strategic analysis
- Summarizing their situation clearly
- Suggesting they might be ready for personalized strategies

If they seem ready (after 8-10 exchanges), you can suggest: "It sounds like we have a good understanding of your situation. Would you like me to analyze everything we've discussed and provide you with personalized communication strategies?"`;
    }

    console.log('Using system prompt for stage:', userMessageCount <= 3 ? 'INFORMATION_GATHERING' : userMessageCount <= 6 ? 'EXPLORATION' : 'ANALYSIS_PREPARATION');

    // Prepare conversation history for OpenAI
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map((msg: ChatMessage) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', conversationHistory.length, 'messages');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response', details: errorData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const aiResponse = await openaiResponse.json();
    console.log('OpenAI response received, usage:', aiResponse.usage);

    const aiMessage = aiResponse.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    // Create response with timestamp
    const response = {
      message: aiMessage,
      timestamp: new Date().toISOString(),
      conversationStage: userMessageCount <= 3 ? 'information_gathering' : userMessageCount <= 6 ? 'exploration' : 'analysis_preparation',
      readyForAnalysis: userMessageCount >= 8
    };

    console.log('=== Handle User Message Function Completed Successfully ===');
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Handle User Message Function Error ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
