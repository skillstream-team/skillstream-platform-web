import React from 'react';

interface AppPageLoaderProps {
  message?: string;
}

export const AppPageLoader: React.FC<AppPageLoaderProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="edu-card flex min-h-[60vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(27,74,128,0.12)] border-t-[color:var(--edu-primary)]" />
        <p className="text-sm edu-muted">{message}</p>
      </div>
    </div>
  );
};
