
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

export const ClientsProTips = () => {
  return (
    <Card className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <Star className="w-5 h-5 mr-2" />
          Pro Tips for Better Coaching Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-900">Context is Key</h4>
            </div>
            <p className="text-purple-700 pl-10">
              Start with context - briefly describe the situation before asking for advice
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-900">Be Specific</h4>
            </div>
            <p className="text-purple-700 pl-10">
              Set clear goals: "improve relationship" vs "handle criticism better"
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-900">Follow Up</h4>
            </div>
            <p className="text-purple-700 pl-10">
              Track progress across sessions to get refined, personalized advice
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
