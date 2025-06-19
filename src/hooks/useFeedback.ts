
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeedbackSubmission {
  sessionId: string;
  targetId: string;
  rating: number;
  suggestionsTriedCount: number;
  outcomeRating?: number;
  whatWorkedWell?: string;
  whatDidntWork?: string;
  additionalNotes?: string;
  suggestedStrategies: string[];
}

export const useFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (feedback: FeedbackSubmission) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save to user_feedback table
      const { data, error: feedbackError } = await supabase
        .from('user_feedback')
        .insert({
          session_id: feedback.sessionId,
          user_id: user.id,
          target_id: feedback.targetId,
          rating: feedback.rating,
          suggestions_tried: feedback.suggestedStrategies.slice(0, feedback.suggestionsTriedCount),
          outcome_rating: feedback.outcomeRating || null,
          what_worked_well: feedback.whatWorkedWell || null,
          what_didnt_work: feedback.whatDidntWork || null,
          additional_notes: feedback.additionalNotes || null
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Update session with feedback summary
      const { error: sessionError } = await supabase
        .from('coaching_sessions')
        .update({
          feedback_rating: feedback.rating,
          feedback_submitted_at: new Date().toISOString(),
          feedback_data: {
            outcome_rating: feedback.outcomeRating,
            suggestions_tried_count: feedback.suggestionsTriedCount,
            has_detailed_feedback: !!(feedback.whatWorkedWell || feedback.whatDidntWork || feedback.additionalNotes)
          }
        })
        .eq('id', feedback.sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve your coaching experience.",
      });

      return data;

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackHistory = async (targetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_feedback')
        .select(`
          *,
          coaching_sessions (
            created_at,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching feedback history:', error);
      throw error;
    }
  };

  return {
    submitFeedback,
    getFeedbackHistory,
    isSubmitting
  };
};
