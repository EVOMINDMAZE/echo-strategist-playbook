export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      coaching_sessions: {
        Row: {
          anticipatory_data: Json | null
          case_file_data: Json | null
          created_at: string
          feedback_data: Json | null
          feedback_rating: number | null
          feedback_submitted_at: string | null
          follow_up_generated: boolean | null
          id: string
          is_continued: boolean | null
          parent_session_id: string | null
          raw_chat_history: Json | null
          session_metadata: Json | null
          status: string
          strategist_output: Json | null
          target_id: string
          user_feedback: string | null
        }
        Insert: {
          anticipatory_data?: Json | null
          case_file_data?: Json | null
          created_at?: string
          feedback_data?: Json | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          follow_up_generated?: boolean | null
          id?: string
          is_continued?: boolean | null
          parent_session_id?: string | null
          raw_chat_history?: Json | null
          session_metadata?: Json | null
          status?: string
          strategist_output?: Json | null
          target_id: string
          user_feedback?: string | null
        }
        Update: {
          anticipatory_data?: Json | null
          case_file_data?: Json | null
          created_at?: string
          feedback_data?: Json | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          follow_up_generated?: boolean | null
          id?: string
          is_continued?: boolean | null
          parent_session_id?: string | null
          raw_chat_history?: Json | null
          session_metadata?: Json | null
          status?: string
          strategist_output?: Json | null
          target_id?: string
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_parent_session_id_fkey"
            columns: ["parent_session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_sessions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      follow_up_triggers: {
        Row: {
          context_reference: Json | null
          created_at: string
          id: string
          is_triggered: boolean | null
          question_text: string
          session_id: string
          target_id: string
          trigger_type: string
          triggered_at: string | null
        }
        Insert: {
          context_reference?: Json | null
          created_at?: string
          id?: string
          is_triggered?: boolean | null
          question_text: string
          session_id: string
          target_id: string
          trigger_type: string
          triggered_at?: string | null
        }
        Update: {
          context_reference?: Json | null
          created_at?: string
          id?: string
          is_triggered?: boolean | null
          question_text?: string
          session_id?: string
          target_id?: string
          trigger_type?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_triggers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_triggers_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relationship_profiles: {
        Row: {
          areas_of_concern: Json | null
          communication_patterns: Json | null
          created_at: string
          current_status: string | null
          id: string
          interaction_history: Json | null
          key_insights: Json | null
          last_pattern_update: string | null
          learning_confidence: number | null
          personality_assessment: Json | null
          relationship_type: string
          successful_strategies: Json | null
          target_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          areas_of_concern?: Json | null
          communication_patterns?: Json | null
          created_at?: string
          current_status?: string | null
          id?: string
          interaction_history?: Json | null
          key_insights?: Json | null
          last_pattern_update?: string | null
          learning_confidence?: number | null
          personality_assessment?: Json | null
          relationship_type: string
          successful_strategies?: Json | null
          target_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          areas_of_concern?: Json | null
          communication_patterns?: Json | null
          created_at?: string
          current_status?: string | null
          id?: string
          interaction_history?: Json | null
          key_insights?: Json | null
          last_pattern_update?: string | null
          learning_confidence?: number | null
          personality_assessment?: Json | null
          relationship_type?: string
          successful_strategies?: Json | null
          target_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_profiles_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      session_contexts: {
        Row: {
          challenges: Json | null
          communication_style: string | null
          context_data: Json | null
          created_at: string
          goals: Json | null
          id: string
          personality_traits: Json | null
          previous_attempts: Json | null
          relationship_duration: string | null
          relationship_type: string
          session_id: string
          updated_at: string
        }
        Insert: {
          challenges?: Json | null
          communication_style?: string | null
          context_data?: Json | null
          created_at?: string
          goals?: Json | null
          id?: string
          personality_traits?: Json | null
          previous_attempts?: Json | null
          relationship_duration?: string | null
          relationship_type: string
          session_id: string
          updated_at?: string
        }
        Update: {
          challenges?: Json | null
          communication_style?: string | null
          context_data?: Json | null
          created_at?: string
          goals?: Json | null
          id?: string
          personality_traits?: Json | null
          previous_attempts?: Json | null
          relationship_duration?: string | null
          relationship_type?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_contexts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          conversation_segment: Json | null
          created_at: string | null
          emotional_tone: Json | null
          extracted_patterns: Json | null
          id: string
          insight_type: string | null
          key_insights: string[] | null
          session_id: string | null
          summary: string | null
          tone_analysis: Json | null
        }
        Insert: {
          conversation_segment?: Json | null
          created_at?: string | null
          emotional_tone?: Json | null
          extracted_patterns?: Json | null
          id?: string
          insight_type?: string | null
          key_insights?: string[] | null
          session_id?: string | null
          summary?: string | null
          tone_analysis?: Json | null
        }
        Update: {
          conversation_segment?: Json | null
          created_at?: string | null
          emotional_tone?: Json | null
          extracted_patterns?: Json | null
          id?: string
          insight_type?: string | null
          key_insights?: string[] | null
          session_id?: string | null
          summary?: string | null
          tone_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_reply_suggestions: {
        Row: {
          context_data: Json | null
          created_at: string | null
          id: string
          last_ai_message: string | null
          message_count: number
          session_id: string | null
          suggestion_text: string
          suggestion_type: string
          target_id: string | null
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_ai_message?: string | null
          message_count: number
          session_id?: string | null
          suggestion_text: string
          suggestion_type: string
          target_id?: string | null
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_ai_message?: string | null
          message_count?: number
          session_id?: string | null
          suggestion_text?: string
          suggestion_type?: string
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_reply_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_reply_suggestions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suggestion_interactions: {
        Row: {
          created_at: string | null
          follow_up_context: Json | null
          id: string
          selected_at: string | null
          session_id: string | null
          suggestion_id: string | null
          target_id: string | null
          user_id: string
          was_effective: boolean | null
        }
        Insert: {
          created_at?: string | null
          follow_up_context?: Json | null
          id?: string
          selected_at?: string | null
          session_id?: string | null
          suggestion_id?: string | null
          target_id?: string | null
          user_id: string
          was_effective?: boolean | null
        }
        Update: {
          created_at?: string | null
          follow_up_context?: Json | null
          id?: string
          selected_at?: string | null
          session_id?: string | null
          suggestion_id?: string | null
          target_id?: string | null
          user_id?: string
          was_effective?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_interactions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "smart_reply_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_interactions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          target_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          target_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          target_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          additional_notes: string | null
          created_at: string | null
          id: string
          outcome_rating: number | null
          rating: number
          session_id: string | null
          suggestions_tried: string[] | null
          target_id: string | null
          updated_at: string | null
          user_id: string
          what_didnt_work: string | null
          what_worked_well: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string | null
          id?: string
          outcome_rating?: number | null
          rating: number
          session_id?: string | null
          suggestions_tried?: string[] | null
          target_id?: string | null
          updated_at?: string | null
          user_id: string
          what_didnt_work?: string | null
          what_worked_well?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string | null
          id?: string
          outcome_rating?: number | null
          rating?: number
          session_id?: string | null
          suggestions_tried?: string[] | null
          target_id?: string | null
          updated_at?: string | null
          user_id?: string
          what_didnt_work?: string | null
          what_worked_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interaction_patterns: {
        Row: {
          created_at: string
          effectiveness_history: Json | null
          id: string
          interaction_context: Json | null
          last_used_at: string | null
          pattern_data: Json
          pattern_type: string
          success_rate: number | null
          target_id: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          effectiveness_history?: Json | null
          id?: string
          interaction_context?: Json | null
          last_used_at?: string | null
          pattern_data: Json
          pattern_type: string
          success_rate?: number | null
          target_id: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          effectiveness_history?: Json | null
          id?: string
          interaction_context?: Json | null
          last_used_at?: string | null
          pattern_data?: Json
          pattern_type?: string
          success_rate?: number | null
          target_id?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interaction_patterns_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          coaching_style: string | null
          created_at: string
          email_notifications: boolean | null
          id: string
          preferred_session_length: number | null
          push_notifications: boolean | null
          session_reminders: boolean | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coaching_style?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          preferred_session_length?: number | null
          push_notifications?: boolean | null
          session_reminders?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coaching_style?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          preferred_session_length?: number | null
          push_notifications?: boolean | null
          session_reminders?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_follow_up_triggers: {
        Args: { session_id_param: string }
        Returns: undefined
      }
      generate_history_summary: {
        Args: { target_id_param: string }
        Returns: string
      }
      get_user_session_analytics: {
        Args: { user_id_param: string }
        Returns: {
          total_sessions: number
          completed_sessions: number
          total_targets: number
          avg_session_duration: unknown
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
