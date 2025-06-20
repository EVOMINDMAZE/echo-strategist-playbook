
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessageRequest {
  sessionId: string;
  targetId: string;
  message: string;
  messageHistory: Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>;
}

interface BackgroundContext {
  sessionInsights?: string;
  relationshipProfile?: any;
  userPatterns?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, targetId, message, messageHistory }: MessageRequest = await req.json();

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

    console.log(`Processing message for session ${sessionId}, user ${user.id}`);

    // **PHASE 1: Enhanced Per-Message Context Integration**
    const backgroundContext = await fetchBackgroundContext(supabase, sessionId, targetId, user.id);
    
    const conversationContext = (messageHistory || [])
      .slice(-8) // Last 8 messages for context
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI Coach'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = buildEnhancedSystemPrompt(backgroundContext, conversationContext);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0]?.message?.content || "I understand. Could you tell me more about that?";

    // Update session with new message
    const updatedHistory = [
      ...(messageHistory || []),
      {
        content: message,
        sender: 'user',
        timestamp: new Date().toISOString()
      },
      {
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }
    ];

    await supabase
      .from('coaching_sessions')
      .update({ 
        raw_chat_history: updatedHistory,
        session_metadata: {
          last_message_at: new Date().toISOString(),
          message_count: updatedHistory.length
        }
      })
      .eq('id', sessionId);

    // **CRITICAL FIX 1: Properly Trigger Continuous Session Analyzer**
    if (updatedHistory.length >= 4 && updatedHistory.length % 4 === 0) { // Every 4 messages
      console.log(`Triggering continuous-session-analyzer for session ${sessionId} with ${updatedHistory.length} messages`);
      
      // Call the analyzer function directly using Supabase client
      try {
        const { data: analyzerResponse, error: analyzerError } = await supabase.functions.invoke('continuous-session-analyzer', {
          body: {
            sessionId,
            targetId,
            userId: user.id,
            messageHistory: updatedHistory.slice(-6) // Last 6 messages for analysis
          }
        });

        if (analyzerError) {
          console.error('Error calling continuous-session-analyzer:', analyzerError);
        } else {
          console.log('Continuous-session-analyzer completed successfully:', analyzerResponse);
        }
      } catch (analyzerInvokeError) {
        console.error('Failed to invoke continuous-session-analyzer:', analyzerInvokeError);
      }
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      sessionId,
      timestamp: new Date().toISOString()
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

async function fetchBackgroundContext(supabase: any, sessionId: string, targetId: string, userId: string): Promise<BackgroundContext> {
  try {
    // Fetch latest session insights
    const { data: sessionSummary } = await supabase
      .from('session_summaries')
      .select('summary, key_insights, extracted_patterns, emotional_tone')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch relationship profile
    const { data: relationshipProfile } = await supabase
      .from('relationship_profiles')
      .select('communication_patterns, key_insights, successful_strategies, personality_assessment')
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .single();

    // Fetch user interaction patterns
    const { data: userPatterns } = await supabase
      .from('user_interaction_patterns')
      .select('pattern_data, success_rate, interaction_context')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .order('success_rate', { ascending: false })
      .limit(3);

    return {
      sessionInsights: sessionSummary?.summary || sessionSummary?.key_insights?.join(', '),
      relationshipProfile,
      userPatterns
    };
  } catch (error) {
    console.error('Error fetching background context:', error);
    return {};
  }
}

function buildEnhancedSystemPrompt(context: BackgroundContext, conversationContext: string): string {
  let prompt = `You are an expert relationship coach specializing in interpersonal communication and conflict resolution. Your goal is to provide thoughtful, practical guidance that helps users navigate their relationships more effectively.

CONVERSATION CONTEXT:
${conversationContext}`;

  // Add User Profile section
  if (context.userPatterns && context.userPatterns.length > 0) {
    prompt += `\n\nUSER PROFILE:
Based on previous interactions, this user tends to:`;
    context.userPatterns.forEach((pattern: any, index: number) => {
      if (pattern.pattern_data && pattern.success_rate) {
        prompt += `\n- ${JSON.stringify(pattern.pattern_data)} (Success rate: ${(pattern.success_rate * 100).toFixed(0)}%)`;
      }
    });
  }

  // Add Target Profile section
  if (context.relationshipProfile) {
    prompt += `\n\nTARGET PROFILE:`;
    if (context.relationshipProfile.communication_patterns) {
      prompt += `\nCommunication Patterns: ${JSON.stringify(context.relationshipProfile.communication_patterns)}`;
    }
    if (context.relationshipProfile.successful_strategies) {
      prompt += `\nSuccessful Strategies: ${JSON.stringify(context.relationshipProfile.successful_strategies)}`;
    }
    if (context.relationshipProfile.key_insights) {
      prompt += `\nKey Insights: ${JSON.stringify(context.relationshipProfile.key_insights)}`;
    }
  }

  // Add Current Session Insights
  if (context.sessionInsights) {
    prompt += `\n\nCURRENT SESSION INSIGHTS:
${context.sessionInsights}`;
  }

  prompt += `\n\nGUIDELINES:
1. Use the profile information to tailor your responses to this specific user and relationship dynamic
2. Reference successful patterns when appropriate
3. Be empathetic and ask follow-up questions to understand the situation better
4. Provide specific, actionable advice based on the relationship context
5. Keep responses conversational and supportive`;

  return prompt;
}
