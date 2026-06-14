import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, Mail, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useCurrencyFormatter } from '../../lib/currency';
import { cn } from '../../lib/utils';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { AuthShell } from '../../components/auth/AuthShell';

type Role = 'TEACHER' | 'STUDENT';
type PlanId = 'creator' | 'studio' | 'academy';

const PLANS: Array<{
  id: PlanId;
  name: string;
  monthlyFee: number;
  minutes: string;
  txFee: number;
  description: string;
  popular?: boolean;
}> = [
  {
    id: 'creator',
    name: 'Creator',
    monthlyFee: 29,
    minutes: '5,000',
    txFee: 10,
    description: 'Solo tutors, music teachers & local coaches.',
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyFee: 99,
    minutes: '40,000',
    txFee: 6,
    description: 'Growing academies and full-time independent educators.',
    popular: true,
  },
  {
    id: 'academy',
    name: 'Academy',
    monthlyFee: 249,
    minutes: '150,000',
    txFee: 5,
    description: 'Training organisations, corporate L&D & multi-teacher operations.',
  },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, notice, clearError, clearNotice } = useAuthStore();
  const invitedRole = (searchParams.get('role') || '').toLowerCase() === 'teacher';
  const invitedEmail = (searchParams.get('email') || '').trim();
  const invitedCode = (searchParams.get('invite') || '').trim();

  const { format: formatPrice } = useCurrencyFormatter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('studio');
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

  const validateStep1 = (): boolean => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Complete all required fields before continuing.');
      return false;
    }
    if (formData.password.length < 8) {
      setFormError('Use a password with at least 8 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return false;
    }
    if (formData.role === 'TEACHER' && !formData.teacherInviteCode.trim()) {
      setFormError('Teacher invite code is required.');
      return false;
    }
    if (!agreedToTerms) {
      setFormError('You must agree to the Terms of Service and Privacy Policy to continue.');
      return false;
    }
    return true;
  };

  const handleStep1 = (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    clearNotice();
    setFormError('');
    if (!validateStep1()) return;
    // Teachers proceed to plan selection; students register immediately
    if (formData.role === 'TEACHER') {
      setStep(2);
    } else {
      void submitRegistration();
    }
  };

  const handleStep2 = (event: React.FormEvent) => {
    event.preventDefault();
    void submitRegistration(selectedPlan);
  };

  const submitRegistration = async (plan?: PlanId) => {
    try {
      await register(formData.name, formData.email, formData.password, formData.role, {
        teacherInviteCode: formData.teacherInviteCode,
        selectedPlan: plan,
      });
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/dashboard');
      }
    } catch {
      // store populates error
    }
  };

  const sharedError = formError || error;

  if (step === 2) {
    return (
      <AuthShell
        title="Choose your plan"
        subtitle="Pick the plan that fits your teaching scale. You can upgrade any time."
        showAside={false}
        footer={
          <p className="text-sm edu-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[color:var(--edu-primary)]">Sign in</Link>
          </p>
        }
      >
        <form onSubmit={handleStep2} className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-4 text-sm text-[color:var(--edu-danger)]">
              {error}
            </div>
          ) : null}

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--edu-muted)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--edu-primary)] text-white">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-[color:var(--edu-muted)]">Account details</span>
            <span className="mx-1 text-[color:var(--edu-border-strong)]">›</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--edu-primary)] text-xs font-bold text-white">2</span>
            <span className="font-semibold text-[color:var(--edu-text)]">Choose plan</span>
          </div>

          {/* Plan cards */}
          <div className="grid gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn('relative rounded-[24px] border p-5 text-left transition-all', selectedPlan === plan.id ? 'border-[rgba(15,139,131,0.45)] bg-[rgba(15,139,131,0.07)] ring-1 ring-[rgba(15,139,131,0.25)]' : 'border-[color:var(--edu-border)] bg-white hover:border-[color:var(--edu-border-strong)]')}
              >
                {plan.popular ? (
                  <span className="absolute right-4 top-4 rounded-full bg-[color:var(--edu-primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-4 pr-24">
                  <div>
                    <p className="text-base font-bold text-[color:var(--edu-text)]">{plan.name}</p>
                    <p className="mt-0.5 text-sm text-[color:var(--edu-muted)]">{plan.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-bold text-[color:var(--edu-text)]">{formatPrice(plan.monthlyFee)}</span>
                    <span className="text-sm text-[color:var(--edu-muted)]"> /mo</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-xs text-[color:var(--edu-muted)]">{plan.minutes} participant-mins included</span>
                  <span className="text-xs text-[color:var(--edu-muted)]">{plan.txFee}% platform fee on paid events</span>
                </div>

                {selectedPlan === plan.id ? (
                  <span className="absolute right-4 bottom-4 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--edu-primary)]">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <button type="submit" className="edu-button-primary w-full" disabled={isLoading}>
            <span>{isLoading ? 'Creating account...' : 'Create account'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => { setStep(1); clearError(); clearNotice(); }}
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--edu-secondary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to account details
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={invitedRole ? 'Teacher onboarding via admin invite.' : 'Join as a student or teacher.'}
      showAside={false}
      footer={
        <p className="text-sm edu-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[color:var(--edu-primary)]">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleStep1} className="space-y-5">
        {sharedError ? (
          <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-4 text-sm text-[color:var(--edu-danger)]">
            {sharedError}
          </div>
        ) : null}
        {!sharedError && notice ? (
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
              onChange={(e) => setFormData((c) => ({ ...c, name: e.target.value }))}
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
              onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
              readOnly={invitedRole && Boolean(invitedEmail)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: 'STUDENT' as Role, title: 'Student', description: 'Join classes and complete lessons.', icon: BookOpen },
            { id: 'TEACHER' as Role, title: 'Teacher', description: 'Create courses and host live sessions.', icon: GraduationCap },
          ]).map((role) => (
            <button
              key={role.id}
              type="button"
              className={cn('rounded-[24px] border p-5 text-left transition-all', formData.role === role.id ? 'border-[rgba(15,139,131,0.35)] bg-[rgba(15,139,131,0.08)]' : 'border-[color:var(--edu-border)] bg-white')}
              onClick={() => setFormData((c) => ({ ...c, role: invitedRole ? 'TEACHER' : role.id }))}
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
              onChange={(e) => setFormData((c) => ({ ...c, teacherInviteCode: e.target.value }))}
              readOnly={Boolean(invitedCode)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="edu-input"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--edu-text)]">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="edu-input"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData((c) => ({ ...c, confirmPassword: e.target.value }))}
          />
        </div>

        <label className="flex items-start gap-3 rounded-[20px] border border-[color:var(--edu-border)] bg-[rgba(27,74,128,0.03)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => { setAgreedToTerms(e.target.checked); if (formError?.includes('Terms')) setFormError(''); }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--edu-border-strong)] accent-[color:var(--edu-primary)]"
          />
          <span className="leading-relaxed text-[color:var(--edu-muted)]">
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--edu-primary)] underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--edu-primary)] underline underline-offset-2">Privacy Policy</Link>
          </span>
        </label>

        <button type="submit" className="edu-button-primary w-full" disabled={isLoading || !agreedToTerms}>
          <span>
            {isLoading ? 'Please wait…' : formData.role === 'TEACHER' ? 'Next: choose your plan' : 'Create account'}
          </span>
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
