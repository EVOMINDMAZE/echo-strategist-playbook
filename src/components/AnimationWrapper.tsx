
import { ReactNode } from 'react';

interface AnimationWrapperProps {
  children: ReactNode;
  type?: 'fade-in' | 'slide-up' | 'scale-in' | 'slide-right' | 'bounce-in';
  delay?: number;
  duration?: number;
  className?: string;
}

export const AnimationWrapper = ({ 
  children, 
  type = 'fade-in', 
  delay = 0, 
  duration = 300,
  className = '' 
}: AnimationWrapperProps) => {
  const getAnimationClass = () => {
    switch (type) {
      case 'fade-in':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'scale-in':
        return 'animate-scale-in';
      case 'slide-right':
        return 'animate-slide-right';
      case 'bounce-in':
        return 'animate-bounce-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div 
      className={`${getAnimationClass()} ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};
