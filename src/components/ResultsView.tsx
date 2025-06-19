
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, RefreshCw, BarChart3, Lightbulb, MessageCircle } from 'lucide-react';
import { Client, SessionData } from '@/types/coaching';
import { FeedbackCollectorProps } from '@/components/FeedbackCollector';
import { FeedbackAnalyticsProps } from '@/components/FeedbackAnalytics';
import { FeedbackInsightsProps } from '@/components/FeedbackInsights';

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
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  const toggleCard = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
    setActiveTab('analytics');
  };

  const { analysis, suggestions } = session.strategist_output || {};

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
                onClick={onContinueSession}
                variant="outline"
                size="sm"
                className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue Chat
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
              <TabsTrigger value="analytics" className="flex items-center space-x-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2 text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Insights</span>
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
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                      {analysis}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
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
                        <CardContent className="space-y-3">
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            {suggestion.description}
                          </p>
                          
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

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-6">
                {onContinueSession && (
                  <Button
                    onClick={onContinueSession}
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

            <TabsContent value="analytics" className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Feedback Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Track your coaching progress and strategy effectiveness</p>
              </div>
              {/* FeedbackAnalytics component would be rendered here */}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Personal Insights</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Discover patterns and trends in your coaching journey</p>
              </div>
              {/* FeedbackInsights component would be rendered here */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
