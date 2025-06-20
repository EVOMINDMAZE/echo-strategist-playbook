
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  sessionId: string;
  targetId: string;
  userId: string;
  messageHistory: Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>;
}

interface ExtractedInsights {
  key_insights: string[];
  emerging_topics: string[];
  actionable_opportunities: string[];
  emotional_tone: {
    user_sentiment: string;
    conversation_energy: string;
    engagement_level: string;
  };
  communication_patterns: {
    user_style: string;
    response_preferences: string[];
    effective_approaches: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, targetId, userId, messageHistory }: AnalysisRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    console.log(`Starting continuous analysis for session ${sessionId}`);

    // **PHASE 2: Continuous Smart Analysis**
    const conversationSegment = messageHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI Coach'}: ${msg.content}`)
      .join('\n');

    const analysisPrompt = `Analyze this recent conversation segment from a relationship coaching session and extract actionable insights:

CONVERSATION SEGMENT:
${conversationSegment}

Extract and return a JSON object with the following structure:
{
  "key_insights": ["insight1", "insight2", "insight3"],
  "emerging_topics": ["topic1", "topic2"],
  "actionable_opportunities": ["opportunity1", "opportunity2"],
  "emotional_tone": {
    "user_sentiment": "positive/neutral/negative/mixed",
    "conversation_energy": "high/medium/low",
    "engagement_level": "very_engaged/engaged/somewhat_engaged/disengaged"
  },
  "communication_patterns": {
    "user_style": "direct/indirect/emotional/analytical/storytelling",
    "response_preferences": ["detailed_examples", "direct_questions", "emotional_validation"],
    "effective_approaches": ["empathetic_listening", "practical_advice", "follow_up_questions"]
  }
}

Focus on patterns that can improve future coaching interactions and relationship understanding.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert relationship coach analyzing conversation patterns to extract actionable insights for future interactions.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    let extractedInsights: ExtractedInsights;
    try {
      extractedInsights = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Error parsing insights JSON:', e);
      extractedInsights = {
        key_insights: ['User engaged in meaningful dialogue'],
        emerging_topics: ['Relationship dynamics'],
        actionable_opportunities: ['Continue building trust'],
        emotional_tone: {
          user_sentiment: 'neutral',
          conversation_energy: 'medium', 
          engagement_level: 'engaged'
        },
        communication_patterns: {
          user_style: 'conversational',
          response_preferences: ['detailed_responses'],
          effective_approaches: ['active_listening']
        }
      };
    }

    // Store analysis in session_summaries
    const { data: summaryData, error: summaryError } = await supabase
      .from('session_summaries')
      .insert({
        session_id: sessionId,
        insight_type: 'incremental_analysis',
        conversation_segment: messageHistory,
        key_insights: extractedInsights.key_insights,
        extracted_patterns: extractedInsights.communication_patterns,
        emotional_tone: extractedInsights.emotional_tone,
        summary: `Analysis of ${messageHistory.length} recent messages: ${extractedInsights.key_insights.join(', ')}`
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error storing session summary:', summaryError);
    } else {
      console.log('Successfully stored session analysis');
    }

    // **PHASE 3: Update Relationship Profile**
    await updateRelationshipProfile(supabase, targetId, userId, extractedInsights);

    // **PHASE 3: Update User Interaction Patterns** 
    await updateUserInteractionPatterns(supabase, targetId, userId, extractedInsights);

    return new Response(JSON.stringify({
      success: true,
      insights: extractedInsights,
      analysisStored: !!summaryData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in continuous-session-analyzer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateRelationshipProfile(supabase: any, targetId: string, userId: string, insights: ExtractedInsights): Promise<void> {
  try {
    // Fetch existing profile
    const { data: existingProfile } = await supabase
      .from('relationship_profiles')
      .select('*')
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .single();

    const updatedCommunicationPatterns = {
      ...existingProfile?.communication_patterns || {},
      latest_observed_style: insights.communication_patterns.user_style,
      effective_approaches: [
        ...existingProfile?.communication_patterns?.effective_approaches || [],
        ...insights.communication_patterns.effective_approaches
      ].slice(0, 10), // Keep top 10
      response_preferences: insights.communication_patterns.response_preferences
    };

    const updatedKeyInsights = [
      ...existingProfile?.key_insights || [],
      ...insights.key_insights
    ].slice(-20); // Keep latest 20 insights

    if (existingProfile) {
      // Update existing profile
      await supabase
        .from('relationship_profiles')
        .update({
          communication_patterns: updatedCommunicationPatterns,
          key_insights: updatedKeyInsights,
          learning_confidence: Math.min((existingProfile.learning_confidence || 0.5) + 0.05, 1.0),
          last_pattern_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('target_id', targetId)
        .eq('user_id', userId);
    } else {
      // Create new profile
      await supabase
        .from('relationship_profiles')
        .insert({
          target_id: targetId,
          user_id: userId,
          relationship_type: 'general', // Default type
          communication_patterns: updatedCommunicationPatterns,
          key_insights: updatedKeyInsights,
          learning_confidence: 0.6,
          last_pattern_update: new Date().toISOString()
        });
    }

    console.log('Successfully updated relationship profile');
  } catch (error) {
    console.error('Error updating relationship profile:', error);
  }
}

async function updateUserInteractionPatterns(supabase: any, targetId: string, userId: string, insights: ExtractedInsights): Promise<void> {
  try {
    const patternType = 'communication_analysis';
    const patternData = {
      user_style: insights.communication_patterns.user_style,
      engagement_level: insights.emotional_tone.engagement_level,
      sentiment_trend: insights.emotional_tone.user_sentiment,
      topics_engaged: insights.emerging_topics,
      analysis_timestamp: new Date().toISOString()
    };

    // Check if pattern exists
    const { data: existingPattern } = await supabase
      .from('user_interaction_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('pattern_type', patternType)
      .single();

    if (existingPattern) {
      // Update existing pattern
      const updatedEffectivenessHistory = [
        ...existingPattern.effectiveness_history || [],
        {
          timestamp: new Date().toISOString(),
          engagement_level: insights.emotional_tone.engagement_level,
          sentiment: insights.emotional_tone.user_sentiment
        }
      ].slice(-10); // Keep last 10 entries

      await supabase
        .from('user_interaction_patterns')
        .update({
          pattern_data: patternData,
          effectiveness_history: updatedEffectivenessHistory,
          usage_count: (existingPattern.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id);
    } else {
      // Create new pattern
      await supabase
        .from('user_interaction_patterns')
        .insert({
          user_id: userId,
          target_id: targetId,
          pattern_type: patternType,
          pattern_data: patternData,
          success_rate: 0.7, // Initial success rate
          usage_count: 1,
          effectiveness_history: [{
            timestamp: new Date().toISOString(),
            engagement_level: insights.emotional_tone.engagement_level,
            sentiment: insights.emotional_tone.user_sentiment
          }],
          interaction_context: {
            analysis_source: 'continuous_session_analyzer',
            initial_insights: insights.key_insights
          },
          last_used_at: new Date().toISOString()
        });
    }

    console.log('Successfully updated user interaction patterns');
  } catch (error) {
    console.error('Error updating user interaction patterns:', error);
  }
}
