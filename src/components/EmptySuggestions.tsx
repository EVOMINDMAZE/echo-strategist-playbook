
import { CheckCircle } from 'lucide-react';

export const EmptySuggestions = () => {
  return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        You're doing great!
      </h3>
      <p className="text-gray-600">
        No specific suggestions at the moment. Keep up the excellent coaching work!
      </p>
    </div>
  );
};
