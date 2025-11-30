import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#00B5AD',
  fullScreen = false,
  message
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: color,
          borderTopColor: 'transparent'
        }}
      />
      {message && (
        <p className="text-sm font-medium" style={{ color }}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Button Loading State
export const ButtonSpinner: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div
      className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
};

