import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrgHubStore } from '../../store/orgHub';
import { OrgRole } from '../../data/orgHub';

const STORAGE_KEY = 'org-onboarding-dismissed';

interface Props {
  onDismiss: () => void;
}

const steps = ['Welcome', 'Invite team', 'Create course', 'Done'];

export const OrgOnboardingWizard: React.FC<Props> = ({ onDismiss }) => {
  const { org, updateOrgDetails, inviteMember, createCourse } = useOrgHubStore();

  const [step, setStep] = useState(0);
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('learner');
  const [invited, setInvited] = useState<string[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveOrg = async () => {
    setSaving(true);
    try { await updateOrgDetails({ logoUrl: logoUrl || undefined }); } finally { setSaving(false); }
    setStep(1);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInvited((prev) => [...prev, inviteEmail.trim()]);
      setInviteEmail('');
    } finally { setSaving(false); }
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) return;
    setSaving(true);
    try { await createCourse({ title: courseTitle.trim(), description: courseDesc.trim() }); } finally { setSaving(false); }
    setStep(3);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-[32px] bg-white p-8 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <button type="button" onClick={handleDismiss} aria-label="Dismiss" className="absolute right-5 top-5 rounded-full p-1 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]">
          <X className="h-4 w-4" />
        </button>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors', i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]')}>
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 ? (
                <div className={cn('h-0.5 flex-1 transition-colors', i < step ? 'bg-emerald-400' : 'bg-[color:var(--hub-soft)]')} />
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--hub-text)]">Welcome to your org portal</h2>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Let&apos;s get {org?.name} set up in a few steps.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[color:var(--hub-text)]">Organisation logo URL <span className="font-normal text-[color:var(--hub-muted)]">(optional)</span></label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 text-sm text-[color:var(--hub-text)] focus:border-[color:var(--hub-primary)] focus:outline-none"
              />
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="h-12 w-auto rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
            </div>
            <button type="button" onClick={() => void handleSaveOrg()} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Step 1: Invite team */}
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--hub-text)]">Invite your team</h2>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Add colleagues who will use the platform.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 text-sm text-[color:var(--hub-text)] focus:border-[color:var(--hub-primary)] focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleInvite(); } }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                className="rounded-2xl border border-[color:var(--hub-border)] px-3 py-2.5 text-sm text-[color:var(--hub-text)] focus:border-[color:var(--hub-primary)] focus:outline-none"
              >
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="button" onClick={() => void handleInvite()} disabled={saving || !inviteEmail.trim()} className="rounded-2xl bg-[color:var(--hub-primary)] px-4 text-sm font-semibold text-white disabled:opacity-60">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {invited.length > 0 ? (
              <div className="space-y-1.5">
                {invited.map((email) => (
                  <div key={email} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-[color:var(--hub-text)]">{email}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-2xl border border-[color:var(--hub-border)] py-3 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                {invited.length > 0 ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 2: Create course */}
        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--hub-text)]">Create your first course</h2>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">You can add modules and content after creating it.</p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. New Employee Onboarding"
                className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 text-sm text-[color:var(--hub-text)] focus:border-[color:var(--hub-primary)] focus:outline-none"
              />
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Short description (optional)"
                rows={3}
                className="w-full resize-none rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 text-sm text-[color:var(--hub-text)] focus:border-[color:var(--hub-primary)] focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); onDismiss(); }} className="flex-1 rounded-2xl border border-[color:var(--hub-border)] py-3 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                Skip for now
              </button>
              <button type="button" onClick={() => void handleCreateCourse()} disabled={saving || !courseTitle.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Creating...' : 'Create course'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 3: Done */}
        {step === 3 ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--hub-text)]">You&apos;re all set!</h2>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{org?.name} is ready to go. Add content to your course, enrol learners, and track progress from this dashboard.</p>
            </div>
            <button type="button" onClick={handleDismiss} className="w-full rounded-2xl bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white">
              Go to dashboard
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const shouldShowOnboarding = (orgId: string, coursesCount: number, membersCount: number) => {
  if (localStorage.getItem(STORAGE_KEY)) return false;
  if (orgId === 'demo-org') return false;
  return coursesCount === 0 && membersCount <= 1;
};
