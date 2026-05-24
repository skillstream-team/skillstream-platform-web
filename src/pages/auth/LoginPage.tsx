import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { AuthShell } from '../../components/auth/AuthShell';

const getHomeRoute = (user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>) => {
  if (user.activeOrgId) {
    const orgRole = user.orgMemberships.find((m) => m.orgId === user.activeOrgId)?.orgRole;
    if (orgRole === 'admin' || orgRole === 'instructor') return `/org/${user.activeOrgId}/dashboard`;
    return '/learn';
  }
  return '/dashboard';
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, resendConfirmation, isLoading, error, notice, clearError, clearNotice } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isResending, setIsResending] = useState(false);

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
      const { user } = useAuthStore.getState();
      navigate(user ? getHomeRoute(user) : '/dashboard');
    } catch {
      // store handles auth error
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

      </form>

    </AuthShell>
  );
};
