
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Briefcase, Family, MessageCircle, Shield, Lock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingData {
  relationship_type: string;
  relationship_duration?: string;
  communication_style?: string;
  personality_traits: string[];
  goals: string[];
  challenges: string[];
  previous_attempts: string[];
  custom_context?: string;
}

interface IntelligentOnboardingProps {
  sessionId: string;
  targetName: string;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const RELATIONSHIP_TYPES = [
  { id: 'romantic', label: 'Romantic Partner', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'family', label: 'Family Member', icon: Family, color: 'from-blue-500 to-indigo-500' },
  { id: 'friend', label: 'Friend', icon: Users, color: 'from-green-500 to-emerald-500' },
  { id: 'colleague', label: 'Colleague', icon: Briefcase, color: 'from-purple-500 to-violet-500' },
  { id: 'other', label: 'Other', icon: MessageCircle, color: 'from-gray-500 to-slate-500' }
];

const COMMUNICATION_STYLES = {
  romantic: ['Direct & Honest', 'Gentle & Understanding', 'Passionate & Expressive', 'Thoughtful & Patient'],
  family: ['Respectful & Calm', 'Firm but Loving', 'Diplomatic', 'Traditional & Formal'],
  friend: ['Casual & Relaxed', 'Supportive & Encouraging', 'Honest & Straightforward', 'Fun & Light-hearted'],
  colleague: ['Professional & Courteous', 'Collaborative', 'Results-focused', 'Diplomatic & Strategic'],
  other: ['Respectful', 'Clear & Direct', 'Empathetic', 'Adaptive']
};

const COMMON_GOALS = {
  romantic: ['Improve communication', 'Resolve conflicts', 'Strengthen intimacy', 'Plan future together', 'Build trust'],
  family: ['Better understanding', 'Set boundaries', 'Heal relationships', 'Improve dynamics', 'Show appreciation'],
  friend: ['Reconnect', 'Address misunderstandings', 'Strengthen bond', 'Make plans together', 'Offer support'],
  colleague: ['Improve collaboration', 'Resolve workplace issues', 'Build professional relationship', 'Negotiate effectively', 'Give feedback'],
  other: ['Build rapport', 'Establish trust', 'Communicate needs', 'Resolve issues', 'Create understanding']
};

export const IntelligentOnboarding = ({ sessionId, targetName, onComplete, onSkip }: IntelligentOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    relationship_type: '',
    personality_traits: [],
    goals: [],
    challenges: [],
    previous_attempts: []
  });
  const [customRelationshipType, setCustomRelationshipType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRelationshipTypeSelect = (type: string) => {
    setData(prev => ({ ...prev, relationship_type: type }));
    if (type !== 'other') {
      setStep(2);
    }
  };

  const handleAddItem = (field: keyof OnboardingData, item: string) => {
    if (Array.isArray(data[field])) {
      const currentArray = data[field] as string[];
      if (!currentArray.includes(item)) {
        setData(prev => ({
          ...prev,
          [field]: [...currentArray, item]
        }));
      }
    }
  };

  const handleRemoveItem = (field: keyof OnboardingData, item: string) => {
    if (Array.isArray(data[field])) {
      setData(prev => ({
        ...prev,
        [field]: (data[field] as string[]).filter(i => i !== item)
      }));
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const finalData = {
        ...data,
        relationship_type: data.relationship_type === 'other' ? customRelationshipType : data.relationship_type
      };

      // Store the context in the database
      await supabase
        .from('session_contexts')
        .insert({
          session_id: sessionId,
          relationship_type: finalData.relationship_type,
          relationship_duration: finalData.relationship_duration,
          communication_style: finalData.communication_style,
          personality_traits: finalData.personality_traits,
          goals: finalData.goals,
          challenges: finalData.challenges,
          previous_attempts: finalData.previous_attempts,
          context_data: { custom_context: finalData.custom_context }
        });

      onComplete(finalData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRelationType = data.relationship_type === 'other' ? 'other' : data.relationship_type;
  const availableGoals = COMMON_GOALS[currentRelationType as keyof typeof COMMON_GOALS] || COMMON_GOALS.other;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%23374151" stroke-width="0.5" opacity="0.3"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] opacity-20"></div>
      
      <Card className="w-full max-w-2xl bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"></div>
        
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Secure & Confidential</span>
            <Lock className="w-4 h-4" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-white">
            Let's understand your relationship with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {targetName}
            </span>
          </CardTitle>
          
          <p className="text-slate-400 text-sm">
            This helps me provide more personalized and effective coaching strategies
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">What's your relationship?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RELATIONSHIP_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant="outline"
                      className={`h-16 border-slate-600 hover:border-slate-500 bg-slate-700/50 hover:bg-slate-700 text-white transition-all duration-300 ${
                        data.relationship_type === type.id ? 'ring-2 ring-purple-500 border-purple-500' : ''
                      }`}
                      onClick={() => handleRelationshipTypeSelect(type.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{type.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {data.relationship_type === 'other' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="custom-type" className="text-slate-300">Specify your relationship:</Label>
                  <Input
                    id="custom-type"
                    value={customRelationshipType}
                    onChange={(e) => setCustomRelationshipType(e.target.value)}
                    placeholder="e.g., Boss, Neighbor, Therapist..."
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  {customRelationshipType && (
                    <Button onClick={() => setStep(2)} className="w-full mt-2 bg-purple-600 hover:bg-purple-500">
                      Continue
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">How long have you known each other?</Label>
                <Select value={data.relationship_duration} onValueChange={(value) => setData(prev => ({ ...prev, relationship_duration: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="less-than-month">Less than a month</SelectItem>
                    <SelectItem value="1-6-months">1-6 months</SelectItem>
                    <SelectItem value="6-months-1-year">6 months - 1 year</SelectItem>
                    <SelectItem value="1-3-years">1-3 years</SelectItem>
                    <SelectItem value="3-5-years">3-5 years</SelectItem>
                    <SelectItem value="more-than-5-years">More than 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">Preferred communication style with them:</Label>
                <Select value={data.communication_style} onValueChange={(value) => setData(prev => ({ ...prev, communication_style: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Choose your approach" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {COMMUNICATION_STYLES[currentRelationType as keyof typeof COMMUNICATION_STYLES]?.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => setStep(1)} variant="outline" className="border-slate-600 text-slate-300">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-500">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">What are your main goals? (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableGoals.map((goal) => (
                    <Badge
                      key={goal}
                      variant={data.goals.includes(goal) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        data.goals.includes(goal) 
                          ? 'bg-purple-600 text-white border-purple-500' 
                          : 'border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                      onClick={() => {
                        if (data.goals.includes(goal)) {
                          handleRemoveItem('goals', goal);
                        } else {
                          handleAddItem('goals', goal);
                        }
                      }}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">Any additional context or specific challenges?</Label>
                <Textarea
                  value={data.custom_context}
                  onChange={(e) => setData(prev => ({ ...prev, custom_context: e.target.value }))}
                  placeholder="Share anything else that might help me understand your situation better..."
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
                />
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => setStep(2)} variant="outline" className="border-slate-600 text-slate-300">
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={loading || data.goals.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                >
                  {loading ? 'Setting up...' : 'Start Coaching Session'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 pt-4 border-t border-slate-700">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">
              Your information is encrypted and private
            </span>
          </div>

          <Button 
            onClick={onSkip} 
            variant="ghost" 
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            Skip for now - I'll share context during our conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
