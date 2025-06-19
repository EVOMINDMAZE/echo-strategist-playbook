
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Suggestion } from '@/types/suggestions';
import { getCategoryIcon, getPriorityColor } from '@/utils/suggestionUtils';

interface SuggestionItemProps {
  suggestion: Suggestion;
  isApplied: boolean;
  onApply: (suggestionId: string) => void;
}

export const SuggestionItem = ({ suggestion, isApplied, onApply }: SuggestionItemProps) => {
  const IconComponent = getCategoryIcon(suggestion.category);

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isApplied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <IconComponent className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`capitalize ${getPriorityColor(suggestion.priority)}`}
        >
          {suggestion.priority}
        </Badge>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Why this helps:</strong> {suggestion.reasoning}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          {suggestion.action_items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={() => onApply(suggestion.id)}
        disabled={isApplied}
        size="sm"
        className={isApplied ? 'bg-green-600 hover:bg-green-600' : ''}
      >
        {isApplied ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Applied
          </>
        ) : (
          'Apply Suggestion'
        )}
      </Button>
    </div>
  );
};
