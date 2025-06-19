
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserMessageRequest {
  sessionId: string;
  message: string;
  targetName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, targetName }: UserMessageRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Get the current session
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select('*, target:targets(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Add user message to chat history
    const userMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...(session.raw_chat_history || []), userMessage];

    // Generate AI response based on conversation stage
    const messageCount = updatedHistory.filter(msg => msg.sender === 'user').length;
    
    let aiResponse;
    let shouldTriggerAnalysis = false;

    if (messageCount === 1) {
      aiResponse = {
        content: "That's really helpful context. Now, what would you say is your main goal with this conversation?",
        options: [
          "Get a second date",
          "Keep the conversation flowing", 
          "Build deeper connection",
          "Clarify where we stand"
        ]
      };
    } else if (messageCount === 2) {
      aiResponse = {
        content: "Perfect! And how would you describe your personality when you're at your best?",
        options: [
          "Witty and playful",
          "Thoughtful and deep",
          "Adventurous and spontaneous", 
          "Caring and supportive"
        ]
      };
    } else {
      aiResponse = {
        content: "Excellent! That gives me a clear picture. Let me pass this to our strategist. This should only take a moment.",
        options: []
      };
      shouldTriggerAnalysis = true;
    }

    // Add AI message to history
    const aiMessage = {
      id: crypto.randomUUID(),
      content: aiResponse.content,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      options: aiResponse.options.length > 0 ? aiResponse.options : undefined
    };

    const finalHistory = [...updatedHistory, aiMessage];

    // Update session with new chat history
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({ 
        raw_chat_history: finalHistory,
        status: shouldTriggerAnalysis ? 'analyzing' : 'gathering_info'
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error('Failed to update session');
    }

    return new Response(JSON.stringify({ 
      message: aiMessage,
      shouldTriggerAnalysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in handle-user-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
