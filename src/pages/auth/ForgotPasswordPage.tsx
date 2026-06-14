import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/utils';

export const ForgotPasswordPage: React.FC = () => {
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const clearError = useAuthStore((state) => state.clearError);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    clearError();

    try {
      await requestPasswordReset(email);
      setStatus('success');
      setMessage('Reset instructions sent. Use the link from your inbox.');
    } catch (submitError) {
      setStatus('error');
      if (submitError && typeof submitError === 'object' && 'message' in submitError) {
        setMessage(String(submitError.message));
      } else {
        setMessage('Could not send reset instructions. Try again.');
      }
    } finally {
      setStatus((current) => (current === 'submitting' ? 'idle' : current));
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email."
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--edu-secondary)]">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {message || error ? (
          <div
            className={cn('rounded-2xl border p-4 text-sm', status === 'success' ? 'border-[rgba(31,157,115,0.24)] bg-[rgba(31,157,115,0.08)] text-[color:var(--edu-success)]' : 'border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] text-[color:var(--edu-danger)]')}
          >
            {message || error}
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
            />
          </div>
        </div>

        <button type="submit" className="edu-button-primary w-full" disabled={status === 'submitting'}>
          <span>{status === 'submitting' ? 'Sending link...' : 'Send reset link'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
};
