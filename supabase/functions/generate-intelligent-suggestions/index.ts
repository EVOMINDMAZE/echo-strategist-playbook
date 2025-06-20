
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

    // Build conversation context with more detail
    const recentMessages = messages.slice(-6); // Last 6 messages for better context
    const conversationContext = recentMessages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI Coach'}: ${msg.content}`)
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

    const systemPrompt = `You are generating highly intelligent, contextual reply suggestions for a relationship coaching conversation. These suggestions must be SPECIFIC USER RESPONSES that directly answer or build upon the AI coach's most recent message.

CRITICAL REQUIREMENTS:
1. Analyze the AI coach's LAST MESSAGE carefully and generate responses that DIRECTLY address what the AI just asked or said
2. Each suggestion must be a SPECIFIC, ACTIONABLE user response that provides concrete information
3. Avoid generic responses like "That makes sense" - instead provide detailed, situational answers
4. Consider the full conversation context to ensure responses are relevant and progressive
5. Generate responses AS IF you are the user answering the AI coach's specific question or request

Current conversation:
${conversationContext}

AI Coach's most recent message: "${lastAiMessage || 'Please share more about your situation'}"

Learning from previous successful suggestions:
${learningContext}

Message count: ${messageCount}
Suggestion stage: ${suggestionType}

Generate 4 SPECIFIC user responses that:
1. DIRECTLY answer or address what the AI coach just asked in their last message
2. Provide concrete details, examples, or specific information relevant to the question
3. Show natural progression of the conversation by adding meaningful context
4. Demonstrate authentic human responses with specific situational details

Examples of GOOD contextual responses (adapt to the actual conversation):
- If AI asked about a friend: "My friend Sarah from work - we've been close for about 3 years but lately she's been distant"
- If AI asked about context: "This happened last Tuesday during our team meeting when she interrupted me in front of everyone"
- If AI asked about feelings: "I felt embarrassed and confused because she's never done that before - it caught me off guard"
- If AI asked about attempts: "I tried texting her yesterday to ask if everything was okay, but she just replied with 'fine' and nothing else"

AVOID these generic responses:
- "That makes sense"
- "Yes, exactly"
- "I haven't thought about it that way"
- "Tell me more"

Response format: Return a JSON array of objects with "text" and "priority" (high/medium/low) fields.
Focus on creating responses that sound like real, specific answers a person would give when asked the AI's exact question.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `The AI coach just said: "${lastAiMessage || 'Please tell me about your situation'}". Generate 4 specific user responses that directly address this message and provide concrete, relevant details based on the conversation context.` }
      ],
      temperature: 0.8,
      max_tokens: 600
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(completion.choices[0].message.content || '[]');
    } catch (e) {
      // Improved fallback suggestions that are more contextual
      suggestions = [
        { text: "Let me give you more specific details about what happened", priority: "high" },
        { text: "This situation has been building up for about two weeks now", priority: "medium" },
        { text: "I should mention that this person and I have a complicated history", priority: "medium" },
        { text: "The most frustrating part is how they responded when I tried to address it", priority: "low" }
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
            priority: suggestion.priority,
            last_ai_message: lastAiMessage
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
