
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, TrendingUp, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpTrigger {
  id: string;
  trigger_type: string;
  question_text: string;
  context_reference: any;
  created_at: string;
}

interface FollowUpPrompterProps {
  targetId: string;
  onQuestionSelect: (question: string, context: any) => void;
  onDismissAll: () => void;
}

export const FollowUpPrompter = ({ targetId, onQuestionSelect, onDismissAll }: FollowUpPrompterProps) => {
  const [triggers, setTriggers] = useState<FollowUpTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowUpTriggers();
  }, [targetId]);

  const loadFollowUpTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_up_triggers')
        .select('*')
        .eq('target_id', targetId)
        .eq('is_triggered', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error loading follow-up triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = async (trigger: FollowUpTrigger) => {
    try {
      // Mark trigger as used
      await supabase
        .from('follow_up_triggers')
        .update({ is_triggered: true, triggered_at: new Date().toISOString() })
        .eq('id', trigger.id);

      onQuestionSelect(trigger.question_text, trigger.context_reference);
      
      // Remove from local state
      setTriggers(prev => prev.filter(t => t.id !== trigger.id));
    } catch (error) {
      console.error('Error marking trigger as used:', error);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'outcome_check': return CheckCircle;
      case 'progress_update': return TrendingUp;
      case 'reaction_inquiry': return MessageCircle;
      default: return Clock;
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'outcome_check': return 'from-green-500 to-emerald-500';
      case 'progress_update': return 'from-blue-500 to-cyan-500';
      case 'reaction_inquiry': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  if (loading || triggers.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-slate-700/50 shadow-xl mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Follow-up Questions</h3>
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
              Based on your last session
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismissAll}
            className="text-slate-400 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          I'd love to hear how things went with our previous suggestions:
        </p>

        <div className="space-y-3">
          {triggers.map((trigger) => {
            const IconComponent = getTriggerIcon(trigger.trigger_type);
            const colorClass = getTriggerColor(trigger.trigger_type);
            
            return (
              <Button
                key={trigger.id}
                variant="outline"
                className="w-full text-left h-auto p-4 border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-300"
                onClick={() => handleQuestionSelect(trigger)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{trigger.question_text}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Click to start with this question
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            These questions help me understand what worked and provide better guidance
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
