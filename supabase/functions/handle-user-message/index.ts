
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

    console.log('Processing message for session:', sessionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI with upgraded model
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
      console.error('Session not found:', sessionError);
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
    const userMessageCount = updatedHistory.filter(msg => msg.sender === 'user').length;

    console.log('User message count:', userMessageCount);

    // Generate natural AI response using GPT-4.1
    const conversationContext = updatedHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are a dating and relationship coach having a natural conversation with someone who wants help with their relationship with ${targetName}. 

Your goal is to:
1. Have a natural, human-like conversation 
2. Gradually understand their situation, goals, and personality
3. Ask thoughtful follow-up questions
4. Show empathy and understanding
5. After gathering enough context (usually 4-6 exchanges), suggest moving to analysis

Current conversation:
${conversationContext}

Guidelines:
- Be conversational and warm, not robotic
- Ask one question at a time
- Build on their previous responses
- Show genuine interest in helping them
- If they've shared enough about their situation, goals, and personality, you can suggest: "I think I have a good understanding of your situation. Let me analyze this and create a personalized strategy for you. This should only take a moment."

Response format: Provide ONLY the response text, no JSON or formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const aiResponseContent = completion.choices[0].message.content || "I understand. Can you tell me more about that?";
    
    // Check if we should trigger analysis (look for key phrases)
    const shouldTriggerAnalysis = aiResponseContent.toLowerCase().includes('analyze this') || 
                                 aiResponseContent.toLowerCase().includes('create a personalized strategy') ||
                                 userMessageCount >= 5;

    console.log('Should trigger analysis:', shouldTriggerAnalysis);

    // Add AI message to history
    const aiMessage = {
      id: crypto.randomUUID(),
      content: aiResponseContent,
      sender: 'ai',
      timestamp: new Date().toISOString()
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
      console.error('Failed to update session:', updateError);
      throw new Error('Failed to update session');
    }

    console.log('Session updated successfully');

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
