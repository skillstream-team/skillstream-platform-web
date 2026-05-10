import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { useAuthStore } from '../../store/auth';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const preparePasswordRecovery = useAuthStore((state) => state.preparePasswordRecovery);
  const clearError = useAuthStore((state) => state.clearError);
  const error = useAuthStore((state) => state.error);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);

  React.useEffect(() => {
    void (async () => {
      clearError();
      setCheckingRecovery(true);
      try {
        await preparePasswordRecovery(window.location.href);
        setRecoveryReady(true);
      } catch (prepareError) {
        setRecoveryReady(false);
        setStatus('error');
        if (prepareError && typeof prepareError === 'object' && 'message' in prepareError) {
          setMessage(String(prepareError.message));
        } else {
          setMessage('Reset link is invalid or expired.');
        }
      } finally {
        setCheckingRecovery(false);
      }
    })();
  }, [clearError, preparePasswordRecovery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    if (!recoveryReady) {
      setStatus('error');
      setMessage('Reset link is invalid or expired.');
      return;
    }
    if (!password || password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    setMessage('');
    try {
      await resetPassword(password);
      setStatus('success');
      setMessage('Password updated. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (submitError) {
      setStatus('error');
      if (submitError && typeof submitError === 'object' && 'message' in submitError) {
        setMessage(String(submitError.message));
      } else {
        setMessage('Could not reset password. The link may have expired.');
      }
    } finally {
      setStatus((current) => (current === 'submitting' ? 'idle' : current));
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password."
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
            className={`rounded-2xl border p-4 text-sm ${
              status === 'success'
                ? 'border-[rgba(31,157,115,0.24)] bg-[rgba(31,157,115,0.08)] text-[color:var(--edu-success)]'
                : 'border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] text-[color:var(--edu-danger)]'
            }`}
          >
            {message || error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="edu-input pl-11"
              placeholder="Create a strong password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="edu-input pl-11"
              placeholder="Repeat the new password"
            />
          </div>
        </div>

        <button type="submit" className="edu-button-primary w-full" disabled={status === 'submitting' || checkingRecovery || !recoveryReady}>
          <span>{checkingRecovery ? 'Checking reset link...' : status === 'submitting' ? 'Saving password...' : 'Reset password'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
};
