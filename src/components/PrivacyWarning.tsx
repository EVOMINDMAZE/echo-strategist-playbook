
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, X, Eye, Lock } from 'lucide-react';

interface PrivacyWarningProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export const PrivacyWarning = ({ isVisible, onDismiss }: PrivacyWarningProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700 shadow-sm animate-fade-in mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  Privacy & Security Reminder
                </h4>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              
              <p className="text-amber-700 dark:text-amber-200 text-sm mb-3">
                Please avoid sharing sensitive information like:
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Credit card numbers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Social security numbers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Passwords or PINs</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Bank account details</span>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700 animate-fade-in">
                  <div className="flex items-start space-x-2">
                    <Eye className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Your conversations are processed securely and used only to provide coaching insights. 
                      You can share personal situations and challenges safely without revealing sensitive data.
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 mt-2 h-6 text-xs p-1"
              >
                {isExpanded ? 'Show less' : 'Learn more'}
              </Button>
            </div>
          </div>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
