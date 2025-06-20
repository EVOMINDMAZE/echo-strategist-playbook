
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

  // Map the actual backend structure to frontend expected structure
  
  // Create analysis from relationship_summary and key_insights
  let analysisText = '';
  if (typeof output.relationship_summary === 'string') {
    analysisText += output.relationship_summary;
  }
  if (Array.isArray(output.key_insights) && output.key_insights.length > 0) {
    if (analysisText) analysisText += '\n\n';
    analysisText += 'Key Insights:\n' + output.key_insights.join('\n• ');
  }
  
  if (analysisText) {
    result.analysis = analysisText;
    console.log('=== UTILS: Created analysis from relationship_summary and key_insights');
  }

  // Map strategic_recommendations to suggestions
  if (Array.isArray(output.strategic_recommendations)) {
    result.suggestions = output.strategic_recommendations.map((rec: any, index: number) => {
      console.log(`=== UTILS: Processing recommendation ${index}:`, rec);
      
      // Handle different possible structures of recommendations
      let suggestion: any = {
        title: rec.strategy || rec.title || rec.recommendation || `Strategy ${index + 1}`,
        description: rec.description || rec.details || rec.approach || 'No description provided',
        why_it_works: rec.why_it_works || rec.rationale || rec.reasoning || 'This approach has proven effective in similar situations'
      };

      console.log(`=== UTILS: Mapped suggestion ${index}:`, suggestion);
      return suggestion;
    });
    console.log('=== UTILS: Added suggestions to result, count:', result.suggestions.length);
  }

  // Fallback: if no strategic_recommendations, try to create suggestions from other fields
  if (!result.suggestions) {
    const fallbackSuggestions = [];
    
    if (Array.isArray(output.communication_strategies)) {
      output.communication_strategies.forEach((strategy: any, index: number) => {
        fallbackSuggestions.push({
          title: typeof strategy === 'string' ? strategy : `Communication Strategy ${index + 1}`,
          description: typeof strategy === 'object' ? strategy.description || strategy.details || strategy : strategy,
          why_it_works: 'Effective communication strategies improve relationship dynamics'
        });
      });
    }

    if (Array.isArray(output.conversation_starters)) {
      output.conversation_starters.forEach((starter: any, index: number) => {
        fallbackSuggestions.push({
          title: `Conversation Starter ${index + 1}`,
          description: typeof starter === 'string' ? starter : starter.text || starter.suggestion,
          why_it_works: 'Starting conversations with thoughtful questions opens dialogue'
        });
      });
    }

    if (fallbackSuggestions.length > 0) {
      result.suggestions = fallbackSuggestions;
      console.log('=== UTILS: Created fallback suggestions, count:', result.suggestions.length);
    }
  }

  const hasValidContent = Object.keys(result).length > 0;
  console.log('=== UTILS: Final result has valid content?:', hasValidContent);
  console.log('=== UTILS: Final result structure:', {
    hasAnalysis: !!result.analysis,
    suggestionCount: result.suggestions ? result.suggestions.length : 0
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
