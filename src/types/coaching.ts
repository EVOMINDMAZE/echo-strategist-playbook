
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
  feedback_data?: {
    outcome_rating?: number;
    suggestions_tried_count?: number;
    has_detailed_feedback?: boolean;
  };
  feedback_rating?: number;
  feedback_submitted_at?: string;
}

export interface UserFeedback {
  id: string;
  session_id: string;
  user_id: string;
  target_id: string;
  rating: number;
  suggestions_tried?: string[];
  outcome_rating?: number;
  what_worked_well?: string;
  what_didnt_work?: string;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackAnalytics {
  average_rating: number;
  total_feedbacks: number;
  suggestions_effectiveness: {
    [key: string]: {
      tried_count: number;
      success_rate: number;
    };
  };
  common_themes: {
    what_works: string[];
    what_doesnt: string[];
  };
}
