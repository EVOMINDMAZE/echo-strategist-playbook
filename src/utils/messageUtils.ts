
import type { ChatMessage } from '@/types/coaching';

export const validateChatMessage = (obj: any): obj is ChatMessage => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    (obj.sender === 'user' || obj.sender === 'ai') &&
    typeof obj.timestamp === 'string' &&
    obj.timestamp.length > 0 &&
    !isNaN(new Date(obj.timestamp).getTime())
  );
};

export const sanitizeChatHistory = (rawHistory: any): ChatMessage[] => {
  if (!Array.isArray(rawHistory)) {
    console.warn('Raw history is not an array:', typeof rawHistory);
    return [];
  }

  return rawHistory
    .filter((msg, index) => {
      const isValid = validateChatMessage(msg);
      if (!isValid) {
        console.warn(`Invalid message at index ${index}:`, msg);
      }
      return isValid;
    })
    .map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp
    }));
};

export const validateStrategistOutput = (rawOutput: any): any => {
  console.log('=== UTILS: validateStrategistOutput called with:', rawOutput);
  console.log('- Type:', typeof rawOutput);
  console.log('- Is null?:', rawOutput === null);
  console.log('- Is undefined?:', rawOutput === undefined);

  if (!rawOutput || typeof rawOutput !== 'object') {
    console.log('=== UTILS: Returning undefined - not a valid object');
    return undefined;
  }

  const output = rawOutput as any;
  const result: any = {};

  console.log('=== UTILS: Processing strategist output:');
  console.log('- Available keys:', Object.keys(output));

  // Create analysis from relationship_summary and key_insights
  let analysisText = '';
  if (typeof output.relationship_summary === 'string') {
    analysisText += output.relationship_summary;
  }
  if (Array.isArray(output.key_insights) && output.key_insights.length > 0) {
    if (analysisText) analysisText += '\n\n';
    analysisText += 'Key Insights:\n• ' + output.key_insights.join('\n• ');
  }
  
  if (analysisText) {
    result.analysis = analysisText;
    console.log('=== UTILS: Created analysis from relationship_summary and key_insights');
  }

  // Map strategic_recommendations to suggestions with enhanced structure including reply_example and timing_advice
  if (Array.isArray(output.strategic_recommendations)) {
    result.suggestions = output.strategic_recommendations.map((rec: any, index: number) => {
      console.log(`=== UTILS: Processing recommendation ${index}:`, rec);
      
      const suggestion: any = {
        title: rec.strategy_title || rec.title || rec.strategy || `Strategy ${index + 1}`,
        description: rec.explanation || rec.description || rec.details || 'No description provided',
        reply_example: rec.reply_example || rec.example || rec.sample_message || '',
        why_it_works: rec.why_it_works || rec.rationale || rec.reasoning || 'This approach has proven effective in similar situations',
        timing_advice: rec.timing_advice || rec.when_to_use || ''
      };

      console.log(`=== UTILS: Mapped suggestion ${index}:`, suggestion);
      return suggestion;
    });
    console.log('=== UTILS: Added suggestions to result, count:', result.suggestions.length);
  }

  // Enhanced fallback with better structure
  if (!result.suggestions) {
    const fallbackSuggestions = [];
    
    if (Array.isArray(output.communication_strategies)) {
      output.communication_strategies.forEach((strategy: any, index: number) => {
        fallbackSuggestions.push({
          title: typeof strategy === 'object' && strategy.title ? strategy.title : `Communication Strategy ${index + 1}`,
          description: typeof strategy === 'object' ? strategy.description || strategy.explanation || strategy : strategy,
          reply_example: typeof strategy === 'object' ? strategy.reply_example || strategy.example || '' : '',
          why_it_works: 'Effective communication strategies improve relationship dynamics',
          timing_advice: ''
        });
      });
    }

    if (Array.isArray(output.conversation_starters)) {
      output.conversation_starters.forEach((starter: any, index: number) => {
        fallbackSuggestions.push({
          title: `Conversation Starter ${index + 1}`,
          description: 'Use this to restart positive dialogue',
          reply_example: typeof starter === 'string' ? starter : starter.text || starter.suggestion || '',
          why_it_works: 'Starting conversations with thoughtful questions opens dialogue',
          timing_advice: 'Use when you want to reconnect and move forward positively'
        });
      });
    }

    if (fallbackSuggestions.length > 0) {
      result.suggestions = fallbackSuggestions;
      console.log('=== UTILS: Created fallback suggestions, count:', result.suggestions.length);
    }
  }

  // Add additional context data with proper mapping
  if (Array.isArray(output.potential_obstacles)) {
    result.potential_obstacles = output.potential_obstacles;
  }
  
  if (Array.isArray(output.success_indicators)) {
    result.success_indicators = output.success_indicators;
  }
  
  if (typeof output.follow_up_timeline === 'string') {
    result.follow_up_timeline = output.follow_up_timeline;
  }

  const hasValidContent = Object.keys(result).length > 0;
  console.log('=== UTILS: Final result has valid content?:', hasValidContent);
  console.log('=== UTILS: Final result structure:', {
    hasAnalysis: !!result.analysis,
    suggestionCount: result.suggestions ? result.suggestions.length : 0,
    hasObstacles: !!result.potential_obstacles,
    hasSuccessIndicators: !!result.success_indicators,
    hasFollowUpTimeline: !!result.follow_up_timeline
  });

  return hasValidContent ? result : undefined;
};

// Helper function to clean corrupted chat histories
export const cleanChatHistory = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) 
      ? msg.timestamp 
      : new Date().toISOString()
  })).filter(msg => msg.content && msg.content.trim().length > 0);
};
