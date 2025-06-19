
import type { ChatMessage } from '@/types/coaching';

export const validateChatMessage = (obj: any): obj is ChatMessage => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    (obj.sender === 'user' || obj.sender === 'ai') &&
    typeof obj.timestamp === 'string'
  );
};

export const sanitizeChatHistory = (rawHistory: any): ChatMessage[] => {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .filter(validateChatMessage)
    .map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp
    }));
};

export const validateStrategistOutput = (rawOutput: any): any => {
  if (!rawOutput || typeof rawOutput !== 'object') {
    return undefined;
  }

  const output = rawOutput as any;
  const result: any = {};

  if (typeof output.analysis === 'string') {
    result.analysis = output.analysis;
  }

  if (Array.isArray(output.suggestions)) {
    result.suggestions = output.suggestions.filter(suggestion => 
      suggestion &&
      typeof suggestion === 'object' &&
      typeof suggestion.title === 'string' &&
      typeof suggestion.description === 'string' &&
      typeof suggestion.why_it_works === 'string'
    );
  }

  return Object.keys(result).length > 0 ? result : undefined;
};
