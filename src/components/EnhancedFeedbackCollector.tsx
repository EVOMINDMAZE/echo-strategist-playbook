
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Target,
  Clock,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackPrompt {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface EnhancedFeedbackCollectorProps {
  sessionId: string;
  targetId: string;
  onFeedbackSubmitted?: () => void;
}

export const EnhancedFeedbackCollector = ({ 
  sessionId, 
  targetId, 
  onFeedbackSubmitted 
}: EnhancedFeedbackCollectorProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackPrompts, setFeedbackPrompts] = useState<FeedbackPrompt[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    generateSmartPrompts();
  }, [sessionId, targetId]);

  const generateSmartPrompts = async () => {
    try {
      // Get session context to create relevant prompts
      const { data: session } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const basePrompts: FeedbackPrompt[] = [
        {
          id: 'overall_rating',
          question: 'How helpful was this coaching session overall?',
          type: 'rating',
          required: true
        },
        {
          id: 'specific_insights',
          question: 'What specific insights or strategies resonated most with you?',
          type: 'text',
          required: true
        },
        {
          id: 'implementation_confidence',
          question: 'How confident do you feel about implementing the suggested strategies?',
          type: 'rating',
          required: true
        },
        {
          id: 'coaching_aspects',
          question: 'Which aspects of the coaching were most valuable?',
          type: 'checkbox',
          options: [
            'Problem analysis',
            'Strategic suggestions',
            'Emotional support',
            'Practical action items',
            'Alternative perspectives',
            'Question techniques'
          ],
          required: false
        },
        {
          id: 'areas_for_improvement',
          question: 'What areas could be improved in future sessions?',
          type: 'multiple_choice',
          options: [
            'More specific action steps',
            'Better understanding of my context',
            'More time to explore issues',
            'Different coaching approach',
            'Additional resources or tools',
            'Nothing - it was excellent'
          ],
          required: false
        },
        {
          id: 'follow_up_interest',
          question: 'Would you like a follow-up session to track progress?',
          type: 'multiple_choice',
          options: ['Yes, within a week', 'Yes, within a month', 'Maybe later', 'No, not needed'],
          required: false
        },
        {
          id: 'additional_thoughts',
          question: 'Any additional thoughts or suggestions?',
          type: 'text',
          required: false
        }
      ];

      setFeedbackPrompts(basePrompts);
    } catch (error) {
      console.error('Error generating feedback prompts:', error);
      // Fallback to basic prompts
      setFeedbackPrompts([
        {
          id: 'overall_rating',
          question: 'How helpful was this coaching session?',
          type: 'rating',
          required: true
        },
        {
          id: 'feedback_text',
          question: 'Please share your thoughts about the session:',
          type: 'text',
          required: true
        }
      ]);
    }
  };

  const handleResponse = (promptId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value
    }));
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Transform responses for database storage
      const feedbackData = {
        user_id: user.id,
        session_id: sessionId,
        target_id: targetId,
        rating: responses.overall_rating || 3,
        what_worked_well: responses.specific_insights || '',
        what_didnt_work: responses.areas_for_improvement || '',
        additional_notes: responses.additional_thoughts || '',
        outcome_rating: responses.implementation_confidence || null,
        suggestions_tried: responses.coaching_aspects || []
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert(feedbackData);

      if (error) throw error;

      toast({
        title: "Feedback Submitted! 🎉",
        description: "Thank you for your valuable feedback. It helps us improve the coaching experience.",
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Error",
        description: "There was an issue submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPrompt = (prompt: FeedbackPrompt) => {
    const response = responses[prompt.id];

    switch (prompt.type) {
      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Not helpful</span>
              <span className="text-sm text-gray-600">Very helpful</span>
            </div>
            <div className="px-3">
              <Slider
                value={[response || 3]}
                onValueChange={(value) => handleResponse(prompt.id, value[0])}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${
                      star <= (response || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                    onClick={() => handleResponse(prompt.id, star)}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <Textarea
            placeholder="Share your thoughts..."
            value={response || ''}
            onChange={(e) => handleResponse(prompt.id, e.target.value)}
            className="min-h-[100px]"
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {prompt.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${prompt.id}_${option}`}
                  name={prompt.id}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponse(prompt.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <label 
                  htmlFor={`${prompt.id}_${option}`}
                  className="text-sm cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {prompt.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${prompt.id}_${option}`}
                  checked={(response || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = response || [];
                    if (checked) {
                      handleResponse(prompt.id, [...currentValues, option]);
                    } else {
                      handleResponse(prompt.id, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <label 
                  htmlFor={`${prompt.id}_${option}`}
                  className="text-sm cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const currentPrompt = feedbackPrompts[currentStep];
  const isLastStep = currentStep === feedbackPrompts.length - 1;
  const canProceed = !currentPrompt?.required || responses[currentPrompt.id];

  if (feedbackPrompts.length === 0) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-blue-500" />
            Session Feedback
          </CardTitle>
          <Badge variant="outline">
            Step {currentStep + 1} of {feedbackPrompts.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / feedbackPrompts.length) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="min-h-[200px]">
          <h3 className="text-lg font-semibold mb-4">
            {currentPrompt.question}
          </h3>
          
          {renderPrompt(currentPrompt)}
          
          {currentPrompt.required && !responses[currentPrompt.id] && (
            <div className="flex items-center text-orange-600 text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              This field is required
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={submitFeedback}
              disabled={!canProceed || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed}
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
