
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SuggestionsLoading = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
