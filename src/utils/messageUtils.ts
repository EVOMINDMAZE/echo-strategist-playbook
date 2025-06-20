
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
  console.log('- Analysis exists?:', typeof output.analysis === 'string');
  console.log('- Analysis content:', output.analysis);
  console.log('- Suggestions exists?:', Array.isArray(output.suggestions));
  console.log('- Suggestions count:', Array.isArray(output.suggestions) ? output.suggestions.length : 'N/A');

  if (typeof output.analysis === 'string') {
    result.analysis = output.analysis;
    console.log('=== UTILS: Added analysis to result');
  }

  if (Array.isArray(output.suggestions)) {
    result.suggestions = output.suggestions.filter(suggestion => {
      const isValid = suggestion &&
        typeof suggestion === 'object' &&
        typeof suggestion.title === 'string' &&
        typeof suggestion.description === 'string' &&
        typeof suggestion.why_it_works === 'string';
      
      if (!isValid) {
        console.log('=== UTILS: Invalid suggestion filtered out:', suggestion);
      }
      return isValid;
    });
    console.log('=== UTILS: Added suggestions to result, count:', result.suggestions.length);
  }

  const hasValidContent = Object.keys(result).length > 0;
  console.log('=== UTILS: Final result has valid content?:', hasValidContent);
  console.log('=== UTILS: Final result:', result);

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
