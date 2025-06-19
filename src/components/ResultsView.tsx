
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, RefreshCw, BarChart3, Lightbulb } from 'lucide-react';
import { Client, SessionData } from '@/types/coaching';
import { FeedbackCollector } from '@/components/FeedbackCollector';
import { FeedbackAnalytics } from '@/components/FeedbackAnalytics';
import { FeedbackInsights } from '@/components/FeedbackInsights';

interface ResultsViewProps {
  session: SessionData;
  client: Client;
  onBackToClients: () => void;
  onNewSession: () => void;
}

export const ResultsView = ({ session, client, onBackToClients, onNewSession }: ResultsViewProps) => {
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
    setActiveTab('analytics'); // Switch to analytics after feedback
  };

  const { analysis, suggestions } = session.strategist_output || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToClients}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">
                  Playbook for {client.name}
                </h2>
                <p className="text-sm text-slate-500">
                  Generated just now
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={onNewSession}
            variant="outline"
            className="border-indigo-200 hover:bg-indigo-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm">
              <TabsTrigger value="results" className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Your Playbook</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-8">
              {/* Header */}
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  Your Personalized Playbook
                </h1>
                <p className="text-lg text-slate-600">
                  Strategic insights tailored specifically for your conversation with {client.name}
                </p>
              </div>

              {/* Analysis Section */}
              {analysis && (
                <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 shadow-lg animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-xl text-indigo-800 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Strategic Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {analysis}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {suggestions && suggestions.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800 text-center">
                    Your Action Plan
                  </h2>
                  <div className="grid gap-6">
                    {suggestions.map((suggestion, index) => (
                      <Card 
                        key={index}
                        className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-slate-200/50 hover:border-indigo-200 animate-fade-in"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {suggestion.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-slate-600 leading-relaxed">
                            {suggestion.description}
                          </p>
                          
                          <Collapsible 
                            open={expandedCards.includes(index)}
                            onOpenChange={() => toggleCard(index)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-between hover:bg-indigo-50"
                              >
                                <span className="text-indigo-600 font-medium">
                                  Why this works
                                </span>
                                {expandedCards.includes(index) ? (
                                  <ChevronUp className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-indigo-600" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 pt-2">
                              <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-300">
                                <p className="text-slate-700 leading-relaxed">
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

              {/* Smart Feedback Collector */}
              {showFeedback && !feedbackSubmitted && (
                <FeedbackCollector
                  session={session}
                  client={client}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                />
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-8">
                <Button
                  onClick={onNewSession}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start New Session
                </Button>
                <Button
                  onClick={onBackToClients}
                  variant="outline"
                  size="lg"
                  className="border-slate-300 hover:bg-slate-50"
                >
                  Choose Different Person
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Feedback Analytics</h2>
                <p className="text-slate-600">Track your coaching progress and strategy effectiveness</p>
              </div>
              <FeedbackAnalytics targetId={session.target_id} />
            </TabsContent>

            <TabsContent value="insights" className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Insights</h2>
                <p className="text-slate-600">Discover patterns and trends in your coaching journey</p>
              </div>
              <FeedbackInsights targetId={session.target_id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
