
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  sessionId: string;
  targetId: string;
  messages: Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>;
  messageCount: number;
  lastAiMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, targetId, messages, messageCount, lastAiMessage }: SuggestionRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get previous successful suggestions for this target
    const { data: previousInteractions } = await supabase
      .from('suggestion_interactions')
      .select(`
        smart_reply_suggestions(suggestion_text, suggestion_type, context_data),
        was_effective,
        follow_up_context
      `)
      .eq('target_id', targetId)
      .eq('user_id', user.id)
      .eq('was_effective', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build conversation context
    const conversationContext = messages
      .slice(-8) // Last 8 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Determine suggestion type based on message count
    let suggestionType = '';
    if (messageCount <= 2) {
      suggestionType = 'getting_started';
    } else if (messageCount <= 4) {
      suggestionType = 'adding_context';
    } else if (messageCount <= 6) {
      suggestionType = 'specific_details';
    } else {
      suggestionType = 'ready_for_analysis';
    }

    // Create learning context from previous successful interactions
    const learningContext = previousInteractions?.map(interaction => 
      `Previously successful: "${interaction.smart_reply_suggestions?.suggestion_text}" (Type: ${interaction.smart_reply_suggestions?.suggestion_type})`
    ).join('\n') || 'No previous interaction data available.';

    const systemPrompt = `You are generating smart reply suggestions for a relationship coaching conversation. These suggestions should be potential USER RESPONSES that the user can click to send to the AI coach.

Current conversation:
${conversationContext}

Learning from previous successful suggestions for this person:
${learningContext}

Message count: ${messageCount}
Suggestion stage: ${suggestionType}

Generate 4 specific, contextual USER RESPONSES that:
1. Are natural responses the user might want to send to the AI coach
2. Build directly on what the AI just said in their last message
3. Provide relevant details, acknowledgments, or answers that advance the conversation
4. Are concise, conversational, and feel authentic to how a real person would respond

These should be ANSWERS or STATEMENTS from the user's perspective, not questions. Think of them as "smart autocomplete" responses that save the user typing time.

Examples of good user responses:
- "That makes sense, let me think about that approach"
- "Yes, that's exactly what happened last week"
- "I haven't tried that before, but I'm willing to give it a shot"
- "Actually, there's more context I should share about this situation"

Response format: Return a JSON array of objects with "text" and "priority" (high/medium/low) fields.
Focus on natural user responses that feel authentic and helpful.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate user response suggestions for: ${lastAiMessage || 'conversation continuation'}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(completion.choices[0].message.content || '[]');
    } catch (e) {
      // Fallback to user-response style suggestions if parsing fails
      suggestions = [
        { text: "That makes sense, let me share more details about the situation", priority: "high" },
        { text: "Yes, that's exactly what I've been experiencing", priority: "medium" },
        { text: "I haven't thought about it that way before", priority: "medium" }
      ];
    }

    // Store suggestions in database
    const suggestionPromises = suggestions.map(async (suggestion: any) => {
      const { data } = await supabase
        .from('smart_reply_suggestions')
        .insert({
          session_id: sessionId,
          target_id: targetId,
          user_id: user.id,
          suggestion_text: suggestion.text,
          suggestion_type: suggestionType,
          context_data: {
            conversation_context: conversationContext,
            message_count: messageCount,
            priority: suggestion.priority
          },
          message_count: messageCount,
          last_ai_message: lastAiMessage
        })
        .select()
        .single();
      
      return { ...suggestion, id: data?.id };
    });

    const storedSuggestions = await Promise.all(suggestionPromises);

    return new Response(JSON.stringify({
      suggestions: storedSuggestions,
      suggestionType,
      messageCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
