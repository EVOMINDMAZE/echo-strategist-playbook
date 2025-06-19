
export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  options?: string[];
}

export type SessionStatus = 'gathering_info' | 'analyzing' | 'complete' | 'error';

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  case_data: Record<string, any>;
  strategist_output?: {
    analysis?: string;
    suggestions?: Array<{
      title: string;
      description: string;
      why_it_works: string;
    }>;
  };
}
