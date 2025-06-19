
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionMetrics {
  sessionId?: string;
  startTime: Date | null;
  duration: number;
  messageCount: number;
  status: 'idle' | 'active' | 'paused' | 'completed';
  targetName?: string;
}

interface RealTimeSessionTrackerProps {
  sessionId?: string;
  targetName?: string;
  onSessionUpdate?: (metrics: SessionMetrics) => void;
}

export const RealTimeSessionTracker = ({ 
  sessionId, 
  targetName,
  onSessionUpdate 
}: RealTimeSessionTrackerProps) => {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    startTime: null,
    duration: 0,
    messageCount: 0,
    status: 'idle',
    targetName
  });
  
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      setMetrics(prev => ({ ...prev, sessionId, targetName }));
      startSession();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sessionId, targetName]);

  const startSession = () => {
    const now = new Date();
    setMetrics(prev => ({
      ...prev,
      startTime: now,
      status: 'active'
    }));

    const id = setInterval(() => {
      setMetrics(prev => {
        if (prev.startTime && prev.status === 'active') {
          const newDuration = Math.floor((Date.now() - prev.startTime.getTime()) / 1000);
          const updatedMetrics = { ...prev, duration: newDuration };
          
          if (onSessionUpdate) {
            onSessionUpdate(updatedMetrics);
          }
          
          return updatedMetrics;
        }
        return prev;
      });
    }, 1000);

    setIntervalId(id);
  };

  const pauseSession = () => {
    setMetrics(prev => ({ ...prev, status: 'paused' }));
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const resumeSession = () => {
    setMetrics(prev => ({ ...prev, status: 'active' }));
    
    const id = setInterval(() => {
      setMetrics(prev => {
        if (prev.startTime && prev.status === 'active') {
          const newDuration = prev.duration + 1;
          return { ...prev, duration: newDuration };
        }
        return prev;
      });
    }, 1000);

    setIntervalId(id);
  };

  const completeSession = async () => {
    setMetrics(prev => ({ ...prev, status: 'completed' }));
    
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Save session metrics to database
    if (sessionId) {
      try {
        await supabase
          .from('coaching_sessions')
          .update({
            status: 'complete',
            feedback_data: {
              session_duration: metrics.duration,
              message_count: metrics.messageCount,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }
  };

  const resetSession = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setMetrics({
      sessionId,
      startTime: null,
      duration: 0,
      messageCount: 0,
      status: 'idle',
      targetName
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (metrics.status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getOptimalDuration = () => {
    // Optimal coaching session is typically 20-30 minutes
    const optimalMin = 20 * 60; // 20 minutes in seconds
    const optimalMax = 30 * 60; // 30 minutes in seconds
    
    if (metrics.duration < optimalMin) {
      return (metrics.duration / optimalMin) * 100;
    } else if (metrics.duration <= optimalMax) {
      return 100;
    } else {
      return 100 - ((metrics.duration - optimalMax) / optimalMax) * 50;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span className="text-lg font-semibold">Session Tracker</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
          </div>
          <Badge variant="outline" className="capitalize">
            {metrics.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Target Name */}
        {metrics.targetName && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Coaching Session with</p>
            <p className="font-medium text-gray-900">{metrics.targetName}</p>
          </div>
        )}

        {/* Duration Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-slate-800 mb-2">
            {formatDuration(metrics.duration)}
          </div>
          <div className="flex justify-center space-x-2 text-sm text-gray-600">
            <span>Messages: {metrics.messageCount}</span>
          </div>
        </div>

        {/* Optimal Duration Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Session Quality</span>
            <span>{Math.round(getOptimalDuration())}%</span>
          </div>
          <Progress 
            value={getOptimalDuration()} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 text-center">
            Optimal range: 20-30 minutes
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-2">
          {metrics.status === 'idle' && (
            <Button onClick={startSession} className="flex items-center space-x-1">
              <Play className="w-4 h-4" />
              <span>Start</span>
            </Button>
          )}
          
          {metrics.status === 'active' && (
            <>
              <Button onClick={pauseSession} variant="outline" className="flex items-center space-x-1">
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </Button>
              <Button onClick={completeSession} className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </Button>
            </>
          )}
          
          {metrics.status === 'paused' && (
            <>
              <Button onClick={resumeSession} className="flex items-center space-x-1">
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </Button>
              <Button onClick={completeSession} variant="outline" className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </Button>
            </>
          )}
          
          {(metrics.status === 'completed' || metrics.status === 'paused') && (
            <Button onClick={resetSession} variant="outline" className="flex items-center space-x-1">
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Session Stats */}
        {metrics.status === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Session Complete! 🎉</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
              <div>Duration: {formatDuration(metrics.duration)}</div>
              <div>Messages: {metrics.messageCount}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
