
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SecretRoomTheme } from '@/components/SecretRoomTheme';
import { useIntelligentOnboarding } from '@/hooks/useIntelligentOnboarding';
import { 
  Users, 
  Heart, 
  Briefcase, 
  UserCheck, 
  MessageCircle, 
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface IntelligentOnboardingProps {
  sessionId: string;
  targetName: string;
  onComplete: (data: any) => void;
  onSkip: () => void;
}

interface OnboardingData {
  relationship_type: string;
  relationship_duration: string;
  communication_style: string;
  personality_traits: string[];
  goals: string[];
  challenges: string[];
  previous_attempts: string[];
  context_data: Record<string, any>;
}

export const IntelligentOnboarding = ({ 
  sessionId, 
  targetName, 
  onComplete, 
  onSkip 
}: IntelligentOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    relationship_type: '',
    relationship_duration: '',
    communication_style: '',
    personality_traits: [],
    goals: [],
    challenges: [],
    previous_attempts: [],
    context_data: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const { saveContext } = useIntelligentOnboarding(sessionId);

  const relationshipTypes = [
    { value: 'romantic_partner', label: 'Romantic Partner', icon: Heart },
    { value: 'friend', label: 'Friend', icon: Users },
    { value: 'family', label: 'Family Member', icon: UserCheck },
    { value: 'colleague', label: 'Colleague', icon: Briefcase },
    { value: 'boss', label: 'Boss/Manager', icon: Target },
    { value: 'other', label: 'Other', icon: MessageCircle }
  ];

  const communicationStyles = [
    'Direct and straightforward',
    'Gentle and diplomatic',
    'Assertive but respectful',
    'Collaborative and inclusive',
    'Formal and professional',
    'Casual and friendly'
  ];

  const commonTraits = [
    'Good listener',
    'Empathetic',
    'Decisive',
    'Patient',
    'Assertive',
    'Analytical',
    'Creative',
    'Supportive'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await saveContext({
        ...data,
        context_data: {
          ...data.context_data,
          target_name: targetName,
          onboarding_completed_at: new Date().toISOString()
        }
      });
      onComplete(data);
    } catch (error) {
      console.error('Error saving context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof OnboardingData, item: string) => {
    const currentArray = data[key] as string[];
    const updated = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateData(key, updated);
  };

  const steps = [
    {
      title: "What's your relationship?",
      description: `Tell us about your relationship with ${targetName}`,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {relationshipTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={data.relationship_type === type.value ? "default" : "outline"}
                  className="h-16 flex-col space-y-2"
                  onClick={() => updateData('relationship_type', type.value)}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-sm">{type.label}</span>
                </Button>
              );
            })}
          </div>
          {data.relationship_type === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-relationship">Please specify:</Label>
              <Input
                id="custom-relationship"
                placeholder="Describe your relationship..."
                value={data.context_data.custom_relationship || ''}
                onChange={(e) => updateData('context_data', {
                  ...data.context_data,
                  custom_relationship: e.target.value
                })}
              />
            </div>
          )}
        </div>
      )
    },
    {
      title: "How long have you known each other?",
      description: "This helps us understand the depth of your relationship",
      content: (
        <div className="space-y-3">
          {['Less than 6 months', '6 months to 2 years', '2-5 years', '5-10 years', 'More than 10 years'].map((duration) => (
            <Button
              key={duration}
              variant={data.relationship_duration === duration ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => updateData('relationship_duration', duration)}
            >
              {duration}
            </Button>
          ))}
        </div>
      )
    },
    {
      title: "How do you prefer to communicate?",
      description: "Choose the style that feels most natural to you",
      content: (
        <div className="space-y-3">
          {communicationStyles.map((style) => (
            <Button
              key={style}
              variant={data.communication_style === style ? "default" : "outline"}
              className="w-full justify-start text-left h-auto p-4"
              onClick={() => updateData('communication_style', style)}
            >
              {style}
            </Button>
          ))}
        </div>
      )
    },
    {
      title: "What are your strengths?",
      description: "Select the traits that describe you best (choose multiple)",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {commonTraits.map((trait) => (
              <Button
                key={trait}
                variant={data.personality_traits.includes(trait) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayItem('personality_traits', trait)}
              >
                {data.personality_traits.includes(trait) && <CheckCircle className="w-4 h-4 mr-1" />}
                {trait}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-traits">Any other strengths?</Label>
            <Input
              id="custom-traits"
              placeholder="Add your own..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  toggleArrayItem('personality_traits', e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      )
    },
    {
      title: "What are your goals?",
      description: "What do you hope to achieve in this relationship?",
      content: (
        <div className="space-y-4">
          <Textarea
            placeholder="Describe what you want to accomplish, improve, or resolve..."
            className="min-h-32"
            value={data.context_data.goals_description || ''}
            onChange={(e) => updateData('context_data', {
              ...data.context_data,
              goals_description: e.target.value
            })}
          />
        </div>
      )
    },
    {
      title: "What challenges are you facing?",
      description: "Help us understand what you're struggling with",
      content: (
        <div className="space-y-4">
          <Textarea
            placeholder="Describe the main issues, conflicts, or difficulties you're experiencing..."
            className="min-h-32"
            value={data.context_data.challenges_description || ''}
            onChange={(e) => updateData('context_data', {
              ...data.context_data,
              challenges_description: e.target.value
            })}
          />
        </div>
      )
    },
    {
      title: "What have you tried before?",
      description: "Let us know about previous attempts to address these issues",
      content: (
        <div className="space-y-4">
          <Textarea
            placeholder="Describe any conversations, strategies, or approaches you've already tried..."
            className="min-h-32"
            value={data.context_data.previous_attempts_description || ''}
            onChange={(e) => updateData('context_data', {
              ...data.context_data,
              previous_attempts_description: e.target.value
            })}
          />
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = 
    (currentStep === 0 && data.relationship_type) ||
    (currentStep === 1 && data.relationship_duration) ||
    (currentStep === 2 && data.communication_style) ||
    (currentStep === 3 && data.personality_traits.length > 0) ||
    (currentStep >= 4);

  return (
    <SecretRoomTheme>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <CardTitle className="text-2xl text-white mb-2">
              {currentStepData.title}
            </CardTitle>
            <p className="text-slate-300">
              {currentStepData.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStepData.content}
            
            <div className="flex justify-between pt-6 border-t border-slate-700">
              <div className="space-x-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Previous
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  onClick={onSkip}
                  className="text-slate-400 hover:text-slate-300"
                >
                  Skip for now
                </Button>
              </div>
              
              <Button
                onClick={isLastStep ? handleComplete : handleNext}
                disabled={!canProceed || isLoading}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
              >
                {isLoading ? (
                  'Saving...'
                ) : isLastStep ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SecretRoomTheme>
  );
};
