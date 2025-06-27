
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface PublicHeaderProps {
  user: User | null;
}

export const PublicHeader = ({ user }: PublicHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Coaching Suite</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/about')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  About
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/pricing')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Pricing
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
