
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send, CheckCircle, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { SessionData, Client } from '@/types/coaching';
import { SmartFeedbackPrompts } from '@/components/SmartFeedbackPrompts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackCollectorProps {
  session: SessionData;
  client: Client;
  onFeedbackSubmitted: () => void;
}

interface FeedbackData {
  rating: number;
  selectedSuggestions: string[];
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
  const [showSmartPrompts, setShowSmartPrompts] = useState(true);
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    selectedSuggestions: [],
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

  const handleSuggestionToggle = (suggestionTitle: string) => {
    setFeedback(prev => ({
      ...prev,
      selectedSuggestions: prev.selectedSuggestions.includes(suggestionTitle)
        ? prev.selectedSuggestions.filter(title => title !== suggestionTitle)
        : [...prev.selectedSuggestions, suggestionTitle]
    }));
  };

  const handleSmartPromptSelect = (prompt: string) => {
    setFeedback(prev => ({ 
      ...prev, 
      additionalNotes: prev.additionalNotes ? `${prev.additionalNotes}\n\n${prompt}` : prompt
    }));
    setShowSmartPrompts(false);
    setCurrentStep(4); // Jump to final step
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
          suggestions_tried: feedback.selectedSuggestions,
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
            suggestions_tried_count: feedback.selectedSuggestions.length,
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
          <div className="animate-scale-in">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
            <p className="text-green-700 mb-4">Your feedback helps us improve your coaching experience.</p>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Your insights are valuable!</span>
            </div>
          </div>
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
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
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
                  className={`p-3 rounded-full transition-all duration-300 hover:scale-110 transform ${
                    star <= feedback.rating 
                      ? 'text-yellow-400 shadow-lg' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= feedback.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            {feedback.rating > 0 && (
              <div className="text-center animate-fade-in">
                <Badge 
                  variant="secondary" 
                  className={`text-sm px-4 py-2 ${
                    feedback.rating === 5 ? 'bg-green-100 text-green-800' :
                    feedback.rating >= 4 ? 'bg-blue-100 text-blue-800' :
                    feedback.rating === 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}
                >
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
                Which strategies did you try?
              </h3>
              <p className="text-slate-600">
                Select the strategies you've tried or plan to try from your playbook.
              </p>
            </div>
            
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.title}-${index}`}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    feedback.selectedSuggestions.includes(suggestion.title)
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                  onClick={() => handleSuggestionToggle(suggestion.title)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={feedback.selectedSuggestions.includes(suggestion.title)}
                      onChange={() => {}} // Handled by parent click
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-slate-700 block mb-1">
                        {suggestion.title}
                      </span>
                      {suggestion.reply_example && (
                        <span className="text-sm text-slate-500 italic">
                          "{suggestion.reply_example.substring(0, 60)}..."
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {feedback.selectedSuggestions.length > 0 && (
              <div className="text-center animate-fade-in">
                <Badge variant="secondary" className="px-4 py-2">
                  {feedback.selectedSuggestions.length} of {suggestions.length} strategies selected
                </Badge>
              </div>
            )}
          </div>
        );

      case 3:
        return feedback.selectedSuggestions.length > 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                How did the strategies work?
              </h3>
              <p className="text-slate-600">
                Rate the effectiveness of the strategies you tried.
              </p>
            </div>
            
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star, 'outcomeRating')}
                  className={`p-3 rounded-full transition-all duration-300 hover:scale-110 transform ${
                    star <= feedback.outcomeRating 
                      ? 'text-green-400 shadow-lg' 
                      : 'text-gray-300 hover:text-green-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= feedback.outcomeRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="specific-feedback" className="text-sm font-medium text-slate-700 mb-2 block">
                  Tell us more about your experience with the strategies (Optional)
                </Label>
                <Textarea
                  id="specific-feedback"
                  value={feedback.whatWorkedWell}
                  onChange={(e) => setFeedback(prev => ({ ...prev, whatWorkedWell: e.target.value }))}
                  placeholder={`For example: "The reply example for '${suggestions[0]?.title || 'Strategy 1'}' worked perfectly..." or "I tried the conversation starter but..."`}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div>
                <Label htmlFor="improvement-suggestions" className="text-sm font-medium text-slate-700 mb-2 block">
                  How could the strategies be improved? (Optional)
                </Label>
                <Textarea
                  id="improvement-suggestions"
                  value={feedback.whatDidntWork}
                  onChange={(e) => setFeedback(prev => ({ ...prev, whatDidntWork: e.target.value }))}
                  placeholder="What would have made the strategies more effective for your specific situation?"
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Quick Thoughts
              </h3>
              <p className="text-slate-600">
                Even if you haven't tried the strategies yet, we'd love your thoughts on the analysis.
              </p>
            </div>
            
            <div>
              <Label htmlFor="quick-notes" className="text-sm font-medium text-slate-700 mb-2 block">
                Your thoughts on the strategic recommendations (Optional)
              </Label>
              <Textarea
                id="quick-notes"
                value={feedback.additionalNotes}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="What did you think about the strategies provided? Were they relevant to your situation?"
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {showSmartPrompts && (
              <SmartFeedbackPrompts 
                session={session} 
                onPromptSelect={handleSmartPromptSelect}
              />
            )}
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Final Thoughts
              </h3>
              <p className="text-slate-600">
                Anything else you'd like to share about your coaching experience?
              </p>
            </div>
            
            <div>
              <Label htmlFor="final-notes" className="text-sm font-medium text-slate-700 mb-2 block">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="final-notes"
                value={feedback.additionalNotes}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any final thoughts about the analysis, the strategies, or how we can improve your coaching experience..."
                className="min-h-[120px] resize-none"
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
        <div className="w-full bg-purple-200 rounded-full h-2 mt-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="min-h-[300px]">
          {renderStep()}
        </div>
        
        <div className="flex justify-between pt-4 border-t border-purple-200">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNextStep}
              disabled={currentStep === 1 && feedback.rating === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || feedback.rating === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
