
import { ReactNode } from 'react';

interface SecretRoomThemeProps {
  children: ReactNode;
}

export const SecretRoomTheme = ({ children }: SecretRoomThemeProps) => {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
