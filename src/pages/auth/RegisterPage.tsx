import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Mail, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { AuthShell } from '../../components/auth/AuthShell';

type Role = 'TEACHER' | 'STUDENT';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, notice, clearError, clearNotice } = useAuthStore();
  const invitedRole = (searchParams.get('role') || '').toLowerCase() === 'teacher';
  const invitedEmail = (searchParams.get('email') || '').trim();
  const invitedCode = (searchParams.get('invite') || '').trim();

  const [formData, setFormData] = useState({
    name: '',
    email: invitedEmail,
    password: '',
    confirmPassword: '',
    role: invitedRole ? ('TEACHER' as Role) : ('STUDENT' as Role),
    teacherInviteCode: invitedCode,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    clearNotice();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Complete all required fields before continuing.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Use a password with at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (formData.role === 'TEACHER' && !formData.teacherInviteCode.trim()) {
      setFormError('Teacher invite code is required.');
      return;
    }

    if (!agreedToTerms) {
      setFormError('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.role, {
        teacherInviteCode: formData.teacherInviteCode,
      });
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/dashboard');
      }
    } catch {
      // store handles auth error
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={invitedRole ? 'Teacher onboarding via admin invite.' : 'Create your student account.'}
      showAside={false}
      footer={
        <p className="text-sm edu-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[color:var(--edu-primary)]">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError || error ? (
          <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-4 text-sm text-[color:var(--edu-danger)]">
            {formError || error}
          </div>
        ) : null}
        {!formError && !error && notice ? (
          <div className="rounded-2xl border border-[rgba(31,157,115,0.24)] bg-[rgba(31,157,115,0.08)] p-4 text-sm text-[color:var(--edu-success)]">
            {notice}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Full name</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              className="edu-input pl-11"
              placeholder="Your full name"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--edu-muted)]" />
            <input
              type="email"
              className="edu-input pl-11"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              readOnly={invitedRole && Boolean(invitedEmail)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {([
            {
              id: 'STUDENT' as Role,
              title: 'Student',
              description: 'Join classes and complete lessons.',
              icon: BookOpen,
            },
            {
              id: 'TEACHER' as Role,
              title: 'Teacher',
              description: 'Create courses and host live sessions.',
              icon: GraduationCap,
            },
          ]).map((role) => (
            <button
              key={role.id}
              type="button"
              className={`rounded-[24px] border p-5 text-left transition-all ${
                formData.role === role.id
                  ? 'border-[rgba(15,139,131,0.35)] bg-[rgba(15,139,131,0.08)]'
                  : 'border-[rgba(20,35,43,0.08)] bg-white'
              }`}
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  role: invitedRole ? 'TEACHER' : role.id,
                }))
              }
              disabled={invitedRole && role.id === 'STUDENT'}
            >
              <role.icon className="h-5 w-5 text-[color:var(--edu-primary)]" />
              <h3 className="mt-4 text-lg font-bold text-[color:var(--edu-text)]">{role.title}</h3>
              <p className="mt-2 text-sm edu-muted">{role.description}</p>
            </button>
          ))}
        </div>

        {formData.role === 'TEACHER' ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[color:var(--edu-text)]">Teacher invite code</label>
            <input
              className="edu-input"
              placeholder="Enter your assigned invite code"
              value={formData.teacherInviteCode}
              onChange={(event) => setFormData((current) => ({ ...current, teacherInviteCode: event.target.value }))}
              readOnly={Boolean(invitedCode)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Password</label>
          <input
            type="password"
            className="edu-input"
            placeholder="Create a password"
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Confirm password</label>
          <input
            type="password"
            className="edu-input"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
          />
        </div>

        <label className="flex items-start gap-3 rounded-[20px] border border-[color:var(--edu-border)] bg-[rgba(27,74,128,0.03)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => {
              setAgreedToTerms(event.target.checked);
              if (formError?.includes('Terms')) setFormError('');
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--edu-border-strong)] accent-[color:var(--edu-primary)]"
          />
          <span className="leading-relaxed text-[color:var(--edu-muted)]">
            I agree to the{' '}
            <a
              href="https://skillstream.app/terms"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[color:var(--edu-primary)] underline underline-offset-2"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="https://skillstream.app/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[color:var(--edu-primary)] underline underline-offset-2"
            >
              Privacy Policy
            </a>
          </span>
        </label>

        <button type="submit" className="edu-button-primary w-full" disabled={isLoading || !agreedToTerms}>
          <span>{isLoading ? 'Creating account...' : 'Create account'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--edu-secondary)]">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
};
