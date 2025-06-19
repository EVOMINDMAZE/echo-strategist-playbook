
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MessageCircle, Sparkles } from 'lucide-react';
import { Target } from '@/pages/Index';

interface TargetSelectionProps {
  targets: Target[];
  onTargetSelect: (target: Target) => void;
  onNewTarget: (name: string) => void;
}

export const TargetSelection = ({ targets, onTargetSelect, onNewTarget }: TargetSelectionProps) => {
  const [showNewTargetForm, setShowNewTargetForm] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');

  const handleNewTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTargetName.trim()) {
      onNewTarget(newTargetName.trim());
      setNewTargetName('');
      setShowNewTargetForm(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Who are we talking about today?
          </h1>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Select someone from your conversations, or add someone new to get personalized coaching.
          </p>
        </div>

        {/* Targets List */}
        <div className="space-y-4 mb-8">
          {targets.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Let's get started!
                </h3>
                <p className="text-slate-500 text-center mb-6">
                  Who is your first conversation with?
                </p>
              </CardContent>
            </Card>
          ) : (
            targets.map((target, index) => (
              <Card 
                key={target.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white/80 backdrop-blur-sm border-slate-200/50 hover:border-indigo-200"
                onClick={() => onTargetSelect(target)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg group-hover:scale-110 transition-transform">
                      {target.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {target.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Added {new Date(target.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add New Target */}
        {!showNewTargetForm ? (
          <Button
            onClick={() => setShowNewTargetForm(true)}
            className="w-full h-14 text-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Someone New
          </Button>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-indigo-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleNewTargetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    What's their name?
                  </label>
                  <Input
                    type="text"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    placeholder="Enter their name..."
                    className="text-lg h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={!newTargetName.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                  >
                    Add & Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewTargetForm(false);
                      setNewTargetName('');
                    }}
                    className="px-6 border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
