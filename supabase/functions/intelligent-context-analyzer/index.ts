
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { sessionId, messages, context } = await req.json()

    // Analyze the conversation for intelligent context extraction
    const analysisPrompt = `
    As an AI relationship coach, analyze this conversation and the provided context to generate intelligent insights and follow-up triggers.

    Context: ${JSON.stringify(context)}
    Recent Messages: ${JSON.stringify(messages.slice(-5))}

    Please provide:
    1. Key relationship insights
    2. Communication patterns observed
    3. Areas of concern or growth
    4. Suggested follow-up questions for next session
    5. Success strategies that might work
    6. Personality assessment updates

    Respond in JSON format with these sections.
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert relationship coach and behavioral analyst. Provide structured, actionable insights.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    })

    const aiResponse = await response.json()
    const analysis = aiResponse.choices[0].message.content

    // Parse the analysis and update the database accordingly
    let parsedAnalysis
    try {
      parsedAnalysis = JSON.parse(analysis)
    } catch (e) {
      console.error('Failed to parse AI analysis:', e)
      parsedAnalysis = { insights: analysis }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: parsedAnalysis,
        sessionId 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error) {
    console.error('Error in intelligent context analyzer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
