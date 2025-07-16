import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  showHome?: boolean;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  showHome = false,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleBack}
        className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {label}
      </button>
      
      {showHome && (
        <button
          onClick={handleHome}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </button>
      )}
    </div>
  );
}; 