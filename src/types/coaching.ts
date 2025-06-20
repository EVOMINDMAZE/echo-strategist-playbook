
export interface Client {
  id: string;
  name: string;
  created_at: string;
  is_favorite?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export type SessionStatus = 'gathering_info' | 'analyzing' | 'complete' | 'error';

export interface StrategicSuggestion {
  title: string;
  description: string;
  reply_example?: string;
  why_it_works: string;
  timing_advice?: string;
}

export interface SessionData {
  id: string;
  target_id: string;
  status: SessionStatus;
  messages: ChatMessage[];
  strategist_output?: {
    analysis?: string;
    suggestions?: StrategicSuggestion[];
    potential_obstacles?: Array<{
      obstacle: string;
      solution: string;
    }>;
    success_indicators?: string[];
    follow_up_timeline?: string;
  };
  case_file_data?: Record<string, any>;
  feedback_data?: Record<string, any>;
  user_feedback?: string;
  parent_session_id?: string;
  is_continued?: boolean;
  feedback_submitted_at?: string;
  feedback_rating?: number;
  created_at: string;
  // Keep case_data for backward compatibility
  case_data?: Record<string, any>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
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
