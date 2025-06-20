
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

    console.log(`Generating concise suggestions for session ${sessionId}, message count: ${messageCount}`);

    // Fetch background context for enhanced suggestions
    const { data: sessionContextData } = await supabase
      .from('session_contexts')
      .select('relationship_type, goals, challenges, communication_style, personality_traits')
      .eq('session_id', sessionId)
      .maybeSingle();

    const { data: relationshipProfileData } = await supabase
      .from('relationship_profiles')
      .select('communication_patterns, key_insights, successful_strategies, areas_of_concern, personality_assessment')
      .eq('target_id', targetId)
      .maybeSingle();

    const { data: userInteractionPatterns } = await supabase
      .from('user_interaction_patterns')
      .select('pattern_data')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get previous successful suggestions for learning
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
      .limit(5);

    // Build conversation context
    const conversationContext = messages
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Build background context string
    let backgroundContext = '';
    if (sessionContextData) {
      backgroundContext += `Session Context: ${JSON.stringify(sessionContextData)}. `;
    }
    if (relationshipProfileData) {
      backgroundContext += `Relationship Profile: ${JSON.stringify(relationshipProfileData)}. `;
    }
    if (userInteractionPatterns) {
      backgroundContext += `User Patterns: ${JSON.stringify(userInteractionPatterns.pattern_data)}. `;
    }

    // Determine suggestion type
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
      `Previously successful: "${interaction.smart_reply_suggestions?.suggestion_text}"`
    ).join('\n') || 'No previous interaction data available.';

    const systemPrompt = `You are generating extremely concise, specific user responses for a relationship coaching conversation. These are responses the USER would send to the AI coach.

Background Context: ${backgroundContext}

Current conversation:
${conversationContext}

Learning from successful patterns:
${learningContext}

AI's most recent message: "${lastAiMessage || 'Please share more about your situation'}"

Generate 4 EXTREMELY CONCISE user responses that:
1. Are EXACTLY 12 words or fewer - this is critical
2. Provide ONE specific detail, fact, or insight per suggestion
3. Directly answer the AI's question or add meaningful context
4. Are diverse and avoid repetition

Examples of perfect length:
- "This happened last Tuesday during our team meeting"
- "My supervisor Sarah has been ignoring my emails"
- "We've been dating for 8 months now"
- "They stormed out when I mentioned my promotion"

CRITICAL: Each suggestion must be 12 words or fewer. Count carefully.

Response format: Return ONLY a JSON array with "text" and "priority" fields.`;

    let suggestions = [];
    try {
      console.log('Requesting ultra-concise suggestions from OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 4 ultra-concise responses to: "${lastAiMessage}"` }
        ],
        temperature: 0.7,
        max_tokens: 150 // Reduced to force brevity
      });

      const rawContent = completion.choices[0].message.content || '';
      console.log('Raw OpenAI response for concise suggestions:', rawContent);

      // Parse JSON response, handling potential markdown formatting
      let parsedContent = rawContent;
      
      // Clean up markdown code blocks if present
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
      
      // Validate suggestions structure and enforce STRICT conciseness
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Invalid suggestions format from OpenAI');
      }

      // Aggressively filter out suggestions longer than 12 words
      suggestions = suggestions.filter(s => {
        if (!s.text) return false;
        const wordCount = s.text.trim().split(/\s+/).length;
        console.log(`Suggestion "${s.text}" has ${wordCount} words`);
        return wordCount <= 12;
      });
      
      if (suggestions.length === 0) {
        console.log('All suggestions were too long, generating ultra-concise fallback');
        throw new Error('All suggestions exceeded 12 word limit, using fallback');
      }

      // Ensure we have exactly 4 suggestions, trim if needed
      suggestions = suggestions.slice(0, 4);
      
      console.log(`Successfully generated ${suggestions.length} ultra-concise AI suggestions`);
      
    } catch (parseError) {
      console.error('Error parsing OpenAI suggestions, using ultra-concise contextual fallback:', parseError);
      
      // Ultra-concise contextual fallback based on conversation content
      const lastMessage = lastAiMessage?.toLowerCase() || '';
      
      if (lastMessage.includes('feel') || lastMessage.includes('emotion')) {
        suggestions = [
          { text: "I felt betrayed when they said that", priority: "high" },
          { text: "It made me question our whole relationship", priority: "medium" },
          { text: "The timing felt deliberately hurtful to me", priority: "medium" },
          { text: "I'm still processing how it affected me", priority: "low" }
        ];
      } else if (lastMessage.includes('happened') || lastMessage.includes('tell me')) {
        suggestions = [
          { text: "It started last Tuesday at dinner", priority: "high" },
          { text: "My colleague Sarah was there too", priority: "medium" },
          { text: "They'd been acting strange all week", priority: "medium" },
          { text: "The argument escalated really quickly", priority: "low" }
        ];
      } else {
        // Default ultra-concise contextual responses
        suggestions = [
          { text: "Let me give you the specific timeline", priority: "high" },
          { text: "This person is my direct manager", priority: "medium" },
          { text: "We've had this issue for weeks", priority: "medium" },
          { text: "They reacted worse than I expected", priority: "low" }
        ];
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
    console.error('Error generating concise suggestions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
