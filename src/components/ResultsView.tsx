
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, RefreshCw, BarChart3, Lightbulb, MessageCircle, Copy, Clock } from 'lucide-react';
import { Client, SessionData } from '@/types/coaching';
import { FeedbackCollector } from '@/components/FeedbackCollector';
import { FeedbackInsights } from '@/components/FeedbackInsights';
import { toast } from 'sonner';

interface ResultsViewProps {
  session: SessionData;
  client: Client;
  onBackToClients: () => void;
  onNewSession: () => void;
  onContinueSession?: () => void;
}

export const ResultsView = ({ 
  session, 
  client, 
  onBackToClients, 
  onNewSession,
  onContinueSession 
}: ResultsViewProps) => {
  console.log('=== RESULTS VIEW: Component rendering with props:');
  console.log('- Session ID:', session?.id);
  console.log('- Session status:', session?.status);
  console.log('- Client name:', client?.name);
  console.log('- Strategist output:', session?.strategist_output);

  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(!session.feedback_submitted_at);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!session.feedback_submitted_at);
  const [activeTab, setActiveTab] = useState(() => {
    // Auto-open feedback tab if session is complete but no feedback submitted
    return session.status === 'complete' && !session.feedback_submitted_at ? 'feedback' : 'results';
  });

  const toggleCard = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleCopyReplyExample = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Reply example copied to clipboard!');
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
    setActiveTab('insights');
  };

  const handleContinueChat = () => {
    if (onContinueSession) {
      onContinueSession();
    }
  };

  const { analysis, suggestions, potential_obstacles, success_indicators, follow_up_timeline } = session.strategist_output || {};

  console.log('=== RESULTS VIEW: Extracted strategist data:');
  console.log('- Analysis:', analysis);
  console.log('- Suggestions count:', Array.isArray(suggestions) ? suggestions.length : 'Not an array or undefined');
  console.log('- Suggestions:', suggestions);

  if (!session.strategist_output) {
    console.log('=== RESULTS VIEW: No strategist output, rendering error state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 p-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToClients}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chats
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold text-red-800 mb-2">No Strategic Analysis Available</h3>
                <p className="text-red-700 mb-4">
                  The strategic analysis data is not available. This might be a temporary issue.
                </p>
                <Button onClick={onBackToClients} className="mr-2">
                  Back to Chats
                </Button>
                <Button onClick={onNewSession} variant="outline">
                  Start New Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  console.log('=== RESULTS VIEW: Rendering full results view');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToClients}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chats
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Playbook for {client.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generated just now
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {onContinueSession && (
              <Button
                onClick={handleContinueChat}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue This Chat
              </Button>
            )}
            <Button
              onClick={onNewSession}
              variant="outline"
              size="sm"
              className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <TabsTrigger value="results" className="flex items-center space-x-2 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Your Playbook</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center space-x-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Share Feedback</span>
                {!feedbackSubmitted && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">!</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2 text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Personal Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-6">
              {/* Header */}
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Your Personalized Playbook
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Strategic insights tailored specifically for your conversation with {client.name}
                </p>
              </div>

              {/* Analysis Section */}
              {analysis && (
                <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-700 shadow-lg animate-fade-in">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-indigo-800 dark:text-indigo-200 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Strategic Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {analysis.split('\n').map((line, index) => (
                        <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm mb-2 last:mb-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strategic Recommendations */}
              {suggestions && suggestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center">
                    Your Action Plan
                  </h2>
                  <div className="grid gap-4">
                    {suggestions.map((suggestion, index) => (
                      <Card 
                        key={index}
                        className="group hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-700 animate-fade-in"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                            {suggestion.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            {suggestion.description}
                          </p>
                          
                          {/* Reply Example - Most prominent section */}
                          {suggestion.reply_example && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-l-4 border-green-400">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm flex items-center">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Ready-to-Send Message
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyReplyExample(suggestion.reply_example)}
                                  className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-green-700 dark:text-green-200 leading-relaxed text-sm italic">
                                "{suggestion.reply_example}"
                              </p>
                            </div>
                          )}

                          {/* Timing Advice */}
                          {suggestion.timing_advice && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-400">
                              <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm flex items-center mb-1">
                                <Clock className="w-4 h-4 mr-2" />
                                Perfect Timing
                              </h4>
                              <p className="text-blue-700 dark:text-blue-200 text-sm">
                                {suggestion.timing_advice}
                              </p>
                            </div>
                          )}
                          
                          <Collapsible 
                            open={expandedCards.includes(index)}
                            onOpenChange={() => toggleCard(index)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-sm"
                                size="sm"
                              >
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  Why this works
                                </span>
                                {expandedCards.includes(index) ? (
                                  <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 pt-2">
                              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 border-l-4 border-indigo-300 dark:border-indigo-600">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                                  {suggestion.why_it_works}
                                </p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Indicators & Follow-up Timeline */}
              {(success_indicators || follow_up_timeline) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {success_indicators && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-800 flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Signs It's Working
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {success_indicators.map((indicator, index) => (
                            <li key={index} className="text-green-700 text-sm flex items-start">
                              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {follow_up_timeline && (
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-purple-800 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Timeline & Next Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-purple-700 text-sm leading-relaxed">
                          {follow_up_timeline}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-6">
                {onContinueSession && (
                  <Button
                    onClick={handleContinueChat}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                    size="default"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Continue This Chat
                  </Button>
                )}
                <Button
                  onClick={onNewSession}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                  size="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
                <Button
                  onClick={onBackToClients}
                  variant="outline"
                  size="default"
                  className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                >
                  Choose Different Person
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Share Your Experience</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Your feedback helps us improve the coaching experience for everyone
                </p>
              </div>
              
              {showFeedback && !feedbackSubmitted ? (
                <FeedbackCollector
                  session={session}
                  client={client}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                />
              ) : (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg animate-fade-in">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Thank You!</h3>
                    <p className="text-green-700 mb-4">
                      {feedbackSubmitted ? 
                        "Your feedback has been submitted and helps us improve your coaching experience." :
                        "You've already provided feedback for this session."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Personal Insights</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Discover patterns and trends in your coaching journey</p>
              </div>
              
              <FeedbackInsights targetId={session.target_id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
