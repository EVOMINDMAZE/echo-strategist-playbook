
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { SessionData, Client } from '@/types/coaching';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackCollectorProps {
  session: SessionData;
  client: Client;
  onFeedbackSubmitted: () => void;
}

interface FeedbackData {
  rating: number;
  suggestionsTriedCount: number;
  outcomeRating: number;
  whatWorkedWell: string;
  whatDidntWork: string;
  additionalNotes: string;
}

export const FeedbackCollector = ({ session, client, onFeedbackSubmitted }: FeedbackCollectorProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    suggestionsTriedCount: 0,
    outcomeRating: 0,
    whatWorkedWell: '',
    whatDidntWork: '',
    additionalNotes: ''
  });

  const totalSteps = 4;
  const suggestions = session.strategist_output?.suggestions || [];

  const handleRatingClick = (rating: number, field: 'rating' | 'outcomeRating') => {
    setFeedback(prev => ({ ...prev, [field]: rating }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (feedback.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating for the analysis quality.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save to user_feedback table
      const { error: feedbackError } = await supabase
        .from('user_feedback')
        .insert({
          session_id: session.id,
          user_id: user.id,
          target_id: session.target_id,
          rating: feedback.rating,
          suggestions_tried: suggestions.slice(0, feedback.suggestionsTriedCount).map(s => s.title),
          outcome_rating: feedback.outcomeRating || null,
          what_worked_well: feedback.whatWorkedWell || null,
          what_didnt_work: feedback.whatDidntWork || null,
          additional_notes: feedback.additionalNotes || null
        });

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
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      setIsSubmitted(true);
      setTimeout(() => {
        onFeedbackSubmitted();
      }, 2000);

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve your coaching experience.",
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  if (isSubmitted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg animate-fade-in">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
          <p className="text-green-700">Your feedback helps us improve your coaching experience.</p>
        </CardContent>
      </Card>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                How was the analysis quality?
              </h3>
              <p className="text-slate-600">
                Rate the helpfulness and accuracy of the strategic insights provided.
              </p>
            </div>
            
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star, 'rating')}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    star <= feedback.rating 
                      ? 'text-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= feedback.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            {feedback.rating > 0 && (
              <div className="text-center text-slate-600 animate-fade-in">
                <Badge variant="secondary" className="text-sm">
                  {feedback.rating === 5 ? 'Excellent!' : 
                   feedback.rating === 4 ? 'Very Good!' :
                   feedback.rating === 3 ? 'Good' :
                   feedback.rating === 2 ? 'Fair' : 'Needs Improvement'}
                </Badge>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Action Taken
              </h3>
              <p className="text-slate-600">
                How many of the suggested strategies did you try or plan to try?
              </p>
            </div>
            
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    index < feedback.suggestionsTriedCount
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setFeedback(prev => ({ 
                    ...prev, 
                    suggestionsTriedCount: index < feedback.suggestionsTriedCount ? index : index + 1 
                  }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border ${
                      index < feedback.suggestionsTriedCount
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-gray-300'
                    }`}>
                      {index < feedback.suggestionsTriedCount && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {suggestion.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {feedback.suggestionsTriedCount > 0 && (
              <div className="text-center animate-fade-in">
                <Badge variant="secondary">
                  {feedback.suggestionsTriedCount} of {suggestions.length} strategies selected
                </Badge>
              </div>
            )}
          </div>
        );

      case 3:
        return feedback.suggestionsTriedCount > 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                How did it go?
              </h3>
              <p className="text-slate-600">
                Rate the outcome of trying the suggested strategies.
              </p>
            </div>
            
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star, 'outcomeRating')}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    star <= feedback.outcomeRating 
                      ? 'text-green-400' 
                      : 'text-gray-300 hover:text-green-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= feedback.outcomeRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="worked-well" className="text-sm font-medium text-slate-700">
                  What worked well? (Optional)
                </Label>
                <Textarea
                  id="worked-well"
                  value={feedback.whatWorkedWell}
                  onChange={(e) => setFeedback(prev => ({ ...prev, whatWorkedWell: e.target.value }))}
                  placeholder="Share what strategies were effective..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="didnt-work" className="text-sm font-medium text-slate-700">
                  What didn't work? (Optional)
                </Label>
                <Textarea
                  id="didnt-work"
                  value={feedback.whatDidntWork}
                  onChange={(e) => setFeedback(prev => ({ ...prev, whatDidntWork: e.target.value }))}
                  placeholder="Share what could be improved..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Additional Thoughts
              </h3>
              <p className="text-slate-600">
                Any other feedback about the analysis or suggestions?
              </p>
            </div>
            
            <div>
              <Label htmlFor="additional-notes" className="text-sm font-medium text-slate-700">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="additional-notes"
                value={feedback.additionalNotes}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Share any other thoughts or suggestions..."
                className="mt-1"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Final Thoughts
              </h3>
              <p className="text-slate-600">
                Anything else you'd like to share about your coaching experience?
              </p>
            </div>
            
            <div>
              <Label htmlFor="final-notes" className="text-sm font-medium text-slate-700">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="final-notes"
                value={feedback.additionalNotes}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any final thoughts, suggestions, or feedback..."
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-lg animate-fade-in my-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-purple-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Share Your Experience
          </CardTitle>
          <Badge variant="outline" className="text-purple-600 border-purple-300">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStep()}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNextStep}
              disabled={currentStep === 1 && feedback.rating === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || feedback.rating === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
