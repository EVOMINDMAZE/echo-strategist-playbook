
import { SessionContinuity } from '@/components/SessionContinuity';
import { IntelligentSuggestions } from '@/components/IntelligentSuggestions';

interface AdvancedFeaturesGridProps {
  userId: string;
}

export const AdvancedFeaturesGrid = ({ userId }: AdvancedFeaturesGridProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
      <SessionContinuity userId={userId} />
      <IntelligentSuggestions userId={userId} />
    </div>
  );
};
