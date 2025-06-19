
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

    // Check if this message was from a suggestion click
    // Look for recent suggestion interactions that might have led to this message
    const recentTime = new Date(Date.now() - 60000).toISOString(); // Last minute
    const { data: recentInteractions } = await supabase
      .from('suggestion_interactions')
      .select('*, smart_reply_suggestions(suggestion_text)')
      .eq('session_id', sessionId)
      .gte('selected_at', recentTime)
      .order('selected_at', { ascending: false })
      .limit(1);

    // If user message closely matches a recent suggestion, mark it as potentially effective
    if (recentInteractions && recentInteractions.length > 0) {
      const lastInteraction = recentInteractions[0];
      const suggestionText = lastInteraction.smart_reply_suggestions?.suggestion_text || '';
      
      // Simple similarity check - in production you might use more sophisticated matching
      if (message.toLowerCase().includes(suggestionText.toLowerCase().substring(0, 20))) {
        console.log('Message likely from suggestion, will track effectiveness');
        // We'll mark this as potentially effective based on AI response quality
      }
    }

    // Generate natural AI response using GPT-4o-mini
    const conversationContext = updatedHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Check if we have enough information for analysis
    const hasEnoughInfo = userMessageCount >= 4;

    const systemPrompt = `You are a dating and relationship coach having a natural conversation with someone who wants help with their relationship with ${targetName}. 

Your goal is to:
1. Have a natural, human-like conversation 
2. Gradually understand their situation, goals, and personality
3. Ask thoughtful follow-up questions
4. Show empathy and understanding
5. ${hasEnoughInfo ? 'If you feel you have enough context about their situation, you can suggest they use the "Get Analysis Now" button to get strategic advice' : 'Continue gathering information about their situation'}

Current conversation:
${conversationContext}

Guidelines:
- Be conversational and warm, not robotic
- Ask one question at a time when needed
- Build on their previous responses
- Show genuine interest in helping them
- ${hasEnoughInfo ? 'You can mention that they can trigger the strategist analysis when they feel ready by using the button that should appear' : 'Continue asking follow-up questions to understand their situation better'}
- Never automatically trigger analysis - let the user decide when they're ready

Response format: Provide ONLY the response text, no JSON or formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const aiResponseContent = completion.choices[0].message.content || "I understand. Can you tell me more about that?";
    
    console.log('AI Response:', aiResponseContent);

    // Add AI message to history
    const aiMessage = {
      id: crypto.randomUUID(),
      content: aiResponseContent,
      sender: 'ai',
      timestamp: new Date().toISOString()
    };

    const finalHistory = [...updatedHistory, aiMessage];

    // Update session with new chat history - never automatically trigger analysis
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({ 
        raw_chat_history: finalHistory,
        status: 'gathering_info' // Always keep gathering info, let user trigger manually
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      throw new Error('Failed to update session');
    }

    // If there was a recent suggestion interaction, update its effectiveness based on AI response quality
    if (recentInteractions && recentInteractions.length > 0) {
      const responseQuality = aiResponseContent.length > 50 && !aiResponseContent.includes('I understand'); // Simple heuristic
      await supabase
        .from('suggestion_interactions')
        .update({ was_effective: responseQuality })
        .eq('id', recentInteractions[0].id);
    }

    console.log('Session updated successfully');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      shouldTriggerAnalysis: false // Never auto-trigger
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
