import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { AuthShell } from '../../components/auth/AuthShell';
import { hasSupabaseConfig } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithOAuth, resendConfirmation, isLoading, error, notice, clearError, clearNotice } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    clearNotice();
    setFormError('');
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      setFormError('Enter both your email and password.');
      return;
    }

    try {
      await login(normalizedEmail, password);
      navigate('/dashboard');
    } catch {
      // store handles auth error
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    clearError();
    clearNotice();
    setFormError('');
    setOauthLoading(provider);

    try {
      await loginWithOAuth(provider);
    } catch {
      // store handles oauth error
    } finally {
      setOauthLoading(null);
    }
  };

  const canResendConfirmation = (error || '').toLowerCase().includes('confirm your email');
  const configError = (error || '').toLowerCase().includes('supabase is not configured');
  const errorMessage = configError
    ? 'Auth is not connected yet. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, then restart the app.'
    : (formError || error);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your SkillStream workspace."
      footer={
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="edu-muted">New to SkillStream?</p>
          <Link to="/register" className="font-semibold text-[color:var(--edu-primary)]">
            Create account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage ? (
          <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-4 text-sm text-[color:var(--edu-danger)]">
            {errorMessage}
            {canResendConfirmation && email.trim() ? (
              <button
                type="button"
                onClick={async () => {
                  setIsResending(true);
                  clearError();
                  try {
                    await resendConfirmation(email.trim());
                  } finally {
                    setIsResending(false);
                  }
                }}
                className="mt-3 inline-flex rounded-full border border-[rgba(27,74,128,0.2)] px-3 py-1.5 text-xs font-semibold text-[color:var(--edu-primary)] transition-colors hover:bg-[rgba(27,74,128,0.08)]"
              >
                {isResending ? 'Sending confirmation...' : 'Resend confirmation email'}
              </button>
            ) : null}
          </div>
        ) : null}
        {!errorMessage && notice ? (
          <div className="rounded-2xl border border-[rgba(31,157,115,0.24)] bg-[rgba(31,157,115,0.08)] p-4 text-sm text-[color:var(--edu-success)]">
            {notice}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="edu-input pl-11"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[color:var(--edu-text)]">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-[color:var(--edu-primary)]">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="edu-input pl-11 pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[color:var(--edu-muted)] transition-colors hover:text-[color:var(--edu-text)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" className="edu-button-primary w-full" disabled={isLoading}>
          <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleOAuth('google')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(17,24,39,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--edu-text)] transition-colors hover:bg-[rgba(27,74,128,0.04)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isLoading || oauthLoading !== null || !hasSupabaseConfig}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.71Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.07.72-2.44 1.14-4.05 1.14-3.12 0-5.77-2.11-6.72-4.95H1.27v3.09A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.93.46 3.76 1.27 5.38l4.01-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.34.61 4.58 1.81l3.43-3.43C17.95 1.21 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4.01 3.09C6.23 6.88 8.88 4.77 12 4.77Z"
              />
            </svg>
            {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
          </button>
          <button
            type="button"
            onClick={() => void handleOAuth('apple')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(17,24,39,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--edu-text)] transition-colors hover:bg-[rgba(27,74,128,0.04)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isLoading || oauthLoading !== null || !hasSupabaseConfig}
          >
            <svg viewBox="0 0 384 512" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M318.7 268.7c-.2-50.3 41.1-74.4 42.9-75.5-23.5-34.3-60-39-73-39.5-31-3.1-60.6 18.3-76.3 18.3-15.8 0-40.1-17.8-65.9-17.3-33.9 .5-65.2 19.7-82.6 49.9-35.3 61.2-9 151.8 25.4 201.4 16.8 24.1 36.8 51.1 63.1 50.1 25.2-1 34.7-16.3 65.2-16.3 30.5 0 39 16.3 65.7 15.8 27.2-.5 44.4-24.6 61.1-48.8 19.2-28 27.1-55.1 27.4-56.5-.6-.2-52.5-20.2-52.9-80.6zM267.1 120.1c14-17 23.4-40.2 20.8-63.8-20.1 .8-44.5 13.4-58.9 30.4-13 15-24.4 38.6-21.3 61.3 22.4 1.7 45.4-11.4 59.4-27.9z" />
            </svg>
            {oauthLoading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
          </button>
        </div>
      </form>

    </AuthShell>
  );
};
