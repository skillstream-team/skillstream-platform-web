import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export const NotFoundPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const home = user ? '/dashboard' : '/';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--hub-bg)] px-6 text-center">
      <p className="text-8xl font-extrabold" style={{ color: '#1b4a80', letterSpacing: '-0.04em' }}>404</p>
      <h1 className="mt-4 text-2xl font-bold text-[color:var(--hub-text)]">Page not found</h1>
      <p className="mt-2 text-sm text-[color:var(--hub-muted)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to={home}
        className="mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ background: '#1b4a80' }}
      >
        {user ? 'Back to dashboard' : 'Go home'}
      </Link>
    </div>
  );
};
