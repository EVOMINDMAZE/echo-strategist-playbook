
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

interface BackgroundContext {
  sessionInsights?: string;
  relationshipProfile?: any;
  userPatterns?: any;
  successfulSuggestions?: any[];
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

    console.log(`Generating suggestions for session ${sessionId}, message count: ${messageCount}`);

    // **PHASE 1: Enhanced Context Integration for Suggestions**
    const backgroundContext = await fetchEnhancedSuggestionContext(supabase, sessionId, targetId, user.id);

    // Build conversation context with more detail
    const recentMessages = messages.slice(-6);
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

    const systemPrompt = buildEnhancedSuggestionPrompt(backgroundContext, conversationContext, lastAiMessage, suggestionType);

    let suggestions = [];
    try {
      console.log('Requesting AI-generated suggestions from OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 4 contextual user responses to: "${lastAiMessage}"` }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      const rawContent = completion.choices[0].message.content || '';
      console.log('Raw OpenAI response:', rawContent);

      // **CRITICAL FIX: Properly parse OpenAI response that may include markdown**
      let parsedContent = rawContent;
      
      // Remove markdown code blocks if present
      if (rawContent.includes('```json')) {
        const jsonStart = rawContent.indexOf('```json') + 7;
        const jsonEnd = rawContent.lastIndexOf('```');
        parsedContent = rawContent.substring(jsonStart, jsonEnd).trim();
      } else if (rawContent.includes('```')) {
        const jsonStart = rawContent.indexOf('```') + 3;
        const jsonEnd = rawContent.lastIndexOf('```');
        parsedContent = rawContent.substring(jsonStart, jsonEnd).trim();
      }

      suggestions = JSON.parse(parsedContent);
      
      // Validate suggestions structure
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Invalid suggestions format from OpenAI');
      }

      console.log(`Successfully generated ${suggestions.length} AI suggestions`);
      
    } catch (parseError) {
      console.error('Error parsing OpenAI suggestions, attempting enhanced fallback:', parseError);
      
      // **CRITICAL FIX 2: Enhanced Fallback to Prevent Generic Responses**
      try {
        const fallbackPrompt = `Generate 4 brief, specific user responses to this AI coach message: "${lastAiMessage || 'Please share more about your situation'}"

Based on this conversation context:
${conversationContext}

Each response should be a direct, specific answer or follow-up that moves the conversation forward. Return only a valid JSON array with "text" and "priority" fields, no markdown formatting.`;

        const fallbackCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant generating specific conversational responses. Always return valid JSON with no markdown formatting.' },
            { role: 'user', content: fallbackPrompt }
          ],
          temperature: 0.8,
          max_tokens: 400
        });

        const fallbackContent = fallbackCompletion.choices[0].message.content || '';
        
        // Apply same markdown cleaning to fallback
        let cleanedFallback = fallbackContent;
        if (fallbackContent.includes('```json')) {
          const jsonStart = fallbackContent.indexOf('```json') + 7;
          const jsonEnd = fallbackContent.lastIndexOf('```');
          cleanedFallback = fallbackContent.substring(jsonStart, jsonEnd).trim();
        } else if (fallbackContent.includes('```')) {
          const jsonStart = fallbackContent.indexOf('```') + 3;
          const jsonEnd = fallbackContent.lastIndexOf('```');
          cleanedFallback = fallbackContent.substring(jsonStart, jsonEnd).trim();
        }
        
        suggestions = JSON.parse(cleanedFallback);
        console.log('Enhanced fallback suggestions generated successfully');
        
      } catch (fallbackError) {
        console.error('Enhanced fallback also failed, using contextual defaults:', fallbackError);
        suggestions = generateContextualFallbackSuggestions(backgroundContext, lastAiMessage, conversationContext);
      }
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
            last_ai_message: lastAiMessage,
            background_context_applied: true
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
      messageCount,
      contextEnhanced: true
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

async function fetchEnhancedSuggestionContext(supabase: any, sessionId: string, targetId: string, userId: string): Promise<BackgroundContext> {
  try {
    // Fetch session insights
    const { data: sessionSummary } = await supabase
      .from('session_summaries')
      .select('summary, key_insights, extracted_patterns')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch relationship profile  
    const { data: relationshipProfile } = await supabase
      .from('relationship_profiles')
      .select('communication_patterns, successful_strategies, key_insights')
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .single();

    // Fetch successful suggestion patterns
    const { data: successfulSuggestions } = await supabase
      .from('suggestion_interactions')
      .select(`
        smart_reply_suggestions(suggestion_text, suggestion_type, context_data),
        was_effective,
        follow_up_context
      `)
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .eq('was_effective', true)
      .order('selected_at', { ascending: false })
      .limit(5);

    // Fetch user patterns
    const { data: userPatterns } = await supabase
      .from('user_interaction_patterns')
      .select('pattern_data, success_rate')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .order('success_rate', { ascending: false })
      .limit(3);

    return {
      sessionInsights: sessionSummary?.key_insights?.join(', ') || sessionSummary?.summary,
      relationshipProfile,
      userPatterns,
      successfulSuggestions
    };
  } catch (error) {
    console.error('Error fetching enhanced suggestion context:', error);
    return {};
  }
}

function buildEnhancedSuggestionPrompt(context: BackgroundContext, conversationContext: string, lastAiMessage: string, suggestionType: string): string {
  let prompt = `You are generating highly intelligent, contextual reply suggestions for a relationship coaching conversation. These suggestions must be SPECIFIC USER RESPONSES that directly answer or build upon the AI coach's most recent message.

CONVERSATION CONTEXT:
${conversationContext}

AI Coach's most recent message: "${lastAiMessage || 'Please share more about your situation'}"`;

  // Add learned context sections
  if (context.successfulSuggestions && context.successfulSuggestions.length > 0) {
    prompt += `\n\nSUCCESSFUL SUGGESTION PATTERNS:`;
    context.successfulSuggestions.forEach((interaction: any) => {
      if (interaction.smart_reply_suggestions) {
        prompt += `\n- "${interaction.smart_reply_suggestions.suggestion_text}" (Type: ${interaction.smart_reply_suggestions.suggestion_type})`;
      }
    });
  }

  if (context.relationshipProfile?.communication_patterns) {
    prompt += `\n\nRELATIONSHIP COMMUNICATION PATTERNS:
${JSON.stringify(context.relationshipProfile.communication_patterns)}`;
  }

  if (context.userPatterns && context.userPatterns.length > 0) {
    prompt += `\n\nUSER COMMUNICATION PREFERENCES:`;
    context.userPatterns.forEach((pattern: any) => {
      prompt += `\n- ${JSON.stringify(pattern.pattern_data)} (${(pattern.success_rate * 100).toFixed(0)}% effective)`;
    });
  }

  if (context.sessionInsights) {
    prompt += `\n\nCURRENT SESSION INSIGHTS: ${context.sessionInsights}`;
  }

  prompt += `\n\nSuggestion stage: ${suggestionType}

Generate 4 SPECIFIC user responses that:
1. DIRECTLY answer or address what the AI coach just asked in their last message
2. Provide concrete details, examples, or specific information relevant to the question
3. Build on learned communication patterns and successful interaction styles
4. Show natural progression of the conversation by adding meaningful context
5. Align with user's demonstrated communication preferences

CRITICAL: Return ONLY a valid JSON array with no markdown formatting. Each object should have "text" and "priority" (high/medium/low) fields.`;

  return prompt;
}

function generateContextualFallbackSuggestions(context: BackgroundContext, lastAiMessage?: string, conversationContext?: string): any[] {
  // Enhanced contextual fallback based on conversation flow
  const lastMsg = lastAiMessage?.toLowerCase() || '';
  
  if (lastMsg.includes('feel') || lastMsg.includes('emotion')) {
    return [
      { text: "I felt confused and hurt when they said that - it caught me completely off guard", priority: "high" },
      { text: "It made me question our entire relationship because they've never acted this way before", priority: "medium" },
      { text: "The worst part is that it happened in front of other people", priority: "medium" },
      { text: "I'm still processing how their words made me feel", priority: "low" }
    ];
  }
  
  if (lastMsg.includes('what happened') || lastMsg.includes('tell me more')) {
    return [
      { text: "It started last Tuesday when they completely ignored my text for two days", priority: "high" },
      { text: "We were at dinner with friends and they made this comment that really stung", priority: "medium" },
      { text: "They've been acting distant ever since we had that disagreement about my career", priority: "medium" },
      { text: "The situation escalated when I tried to bring up my concerns directly", priority: "low" }
    ];
  }
  
  // Default contextual responses
  return [
    { text: "Let me give you the specific details about what happened", priority: "high" },
    { text: "This has been building up over the past few weeks", priority: "medium" },
    { text: "I should mention that we have a complicated history with this issue", priority: "medium" },
    { text: "The most challenging part is how they reacted when I tried to address it", priority: "low" }
  ];
}
