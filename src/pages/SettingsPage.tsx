import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Camera, Eye, EyeOff, KeyRound, Mail, Palette, ShieldCheck, Tag, UserCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { WorkspacePreferences, usePreferencesStore } from '../store/preferences';
import { useNotifications } from '../components/notifications/NotificationToast';
import { cn, getInitials } from '../lib/utils';
import { STUDENT_THEMES } from '../data/studentThemes';

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{title}</p>
      <p className="mt-1 text-xs text-[color:var(--hub-muted)]">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={title}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-[color:var(--hub-primary)]' : 'bg-[rgba(100,116,139,0.35)]')}
    >
      <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white transition-all', checked ? 'left-6' : 'left-1')} />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const changePassword = useAuthStore((state) => state.changePassword);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const isStudent = user?.role === 'STUDENT';
  const isDemo = Boolean(user?.id?.startsWith('demo-') || user?.email?.endsWith('@skillstream.demo'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedPreferences = usePreferencesStore((state) => state.preferences);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const { addNotification } = useNotifications();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [subjects, setSubjects] = useState(user?.subjects || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const isProfileDirty =
    displayName.trim() !== (user?.name || '') ||
    bio.trim() !== (user?.bio || '') ||
    subjects.trim() !== (user?.subjects || '');

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Preferences state
  const [draft, setDraft] = useState<WorkspacePreferences>(storedPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(storedPreferences);

  useEffect(() => { setDraft(storedPreferences); }, [storedPreferences]);
  useEffect(() => {
    setDisplayName(user?.name || '');
    setBio(user?.bio || '');
    setSubjects(user?.subjects || '');
  }, [user?.name, user?.bio, user?.subjects]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
          {isStudent ? 'Keep your learning setup simple.' : 'Keep the teaching workspace focused.'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[color:var(--hub-muted)]">
          {isStudent
            ? 'Manage your profile, account security, and notification preferences.'
            : 'Manage your profile, account security, and workspace preferences.'}
        </p>
      </section>

      {/* Profile */}
      <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-5 w-5 text-[color:var(--hub-primary)]" />
          <div>
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Profile</p>
            <p className="text-sm text-[color:var(--hub-muted)]">Your public-facing name, bio, and details.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            aria-label="Upload profile photo"
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-lg font-bold text-white transition"
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
              : getInitials(user?.name || user?.email)}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              {isUploadingAvatar
                ? <span className="text-[10px] font-semibold text-white">Saving…</span>
                : <Camera className="h-5 w-5 text-white" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = '';
              try {
                setIsUploadingAvatar(true);
                setAvatarError('');
                await uploadAvatar(file);
                addNotification({ type: 'success', title: 'Photo updated', message: 'Your profile photo has been saved.', duration: 2200 });
              } catch (err) {
                setAvatarError(err instanceof Error ? err.message : 'Could not upload photo.');
              } finally {
                setIsUploadingAvatar(false);
              }
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{user?.name}</p>
            <p className="truncate text-xs text-[color:var(--hub-muted)]">{user?.email}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{user?.role}</p>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">
              {isDemo ? 'Photo upload not available in demo mode.' : 'Click photo to upload · Max 2 MB'}
            </p>
          </div>
        </div>
        {avatarError ? <p className="mt-3 text-xs text-[color:var(--edu-danger)]">{avatarError}</p> : null}

        <form
          className="mt-5 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedName = displayName.trim();
            if (!trimmedName) {
              setProfileError('Display name cannot be empty.');
              return;
            }
            try {
              setIsSavingProfile(true);
              setProfileError('');
              await updateUser({ name: trimmedName, bio: bio.trim(), subjects: subjects.trim() || undefined });
              addNotification({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.', duration: 2200 });
            } catch (error) {
              setProfileError(error instanceof Error ? error.message : 'Could not update profile.');
            } finally {
              setIsSavingProfile(false);
            }
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium text-[color:var(--hub-text)]">
            Display name
            <input
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); if (profileError) setProfileError(''); }}
              placeholder="Your full name"
              className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-[color:var(--hub-text)]">
            {isStudent ? 'About me' : 'Bio'}
            <textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); if (profileError) setProfileError(''); }}
              placeholder={isStudent ? 'A short intro about yourself and your learning goals...' : 'A short intro about yourself, your teaching style, and experience...'}
              rows={3}
              className="resize-none rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
            />
          </label>

          {!isStudent ? (
            <label className="grid gap-1.5 text-sm font-medium text-[color:var(--hub-text)]">
              Subjects / specialities
              <input
                value={subjects}
                onChange={(e) => { setSubjects(e.target.value); if (profileError) setProfileError(''); }}
                placeholder="e.g. Piano, Music Theory, Guitar"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
              />
              <span className="text-xs font-normal text-[color:var(--hub-muted)]">Comma-separated list of subjects you teach.</span>
            </label>
          ) : null}

          {profileError ? <p className="text-xs text-[color:var(--edu-danger)]">{profileError}</p> : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!isProfileDirty || isSavingProfile}
              className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Save profile'}
            </button>
            {isProfileDirty ? (
              <button
                type="button"
                onClick={() => { setDisplayName(user?.name || ''); setBio(user?.bio || ''); setSubjects(user?.subjects || ''); setProfileError(''); }}
                className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {isStudent ? (
          <div className="mt-5 border-t border-[color:var(--hub-border)] pt-5">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[color:var(--hub-primary)]" />
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">Theme color</p>
            </div>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">
              Pick your personal accent color — works in both light and dark mode.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {(Object.entries(STUDENT_THEMES) as [string, { label: string; light: string; dark: string }][]).map(([key, themeEntry]) => {
                const isActive = storedPreferences.studentTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => void updatePreferences({ studentTheme: key }, user?.id)}
                    aria-label={themeEntry.label}
                    title={themeEntry.label}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full transition"
                    style={{
                      backgroundColor: themeEntry.light,
                      boxShadow: isActive
                        ? `0 0 0 2px white, 0 0 0 4px ${themeEntry.light}`
                        : '0 1px 3px rgba(15,23,42,0.18)',
                    }}
                  >
                    {isActive ? (
                      <svg className="h-4 w-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Account security */}
      <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-[color:var(--hub-primary)]" />
          <div>
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Account security</p>
            <p className="text-sm text-[color:var(--hub-muted)]">Update your email address or password.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-6">
          {/* Change email */}
          <div>
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <Mail className="h-4 w-4" />
              <p className="text-sm font-semibold">Change email</p>
            </div>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Current: <span className="font-medium text-[color:var(--hub-text)]">{user?.email}</span></p>
            <form
              className="mt-3 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!newEmail.trim()) { setEmailError('Enter a new email address.'); return; }
                if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) { setEmailError('This is already your current email.'); return; }
                try {
                  setIsSavingEmail(true);
                  setEmailError('');
                  await updateEmail(newEmail);
                  setNewEmail('');
                  addNotification({
                    type: 'success',
                    title: 'Email updated',
                    message: isDemo
                      ? 'Email updated for this session.'
                      : 'Check your new inbox for a confirmation link.',
                    duration: 3000,
                  });
                } catch (error) {
                  setEmailError(error instanceof Error ? error.message : 'Could not update email.');
                } finally {
                  setIsSavingEmail(false);
                }
              }}
            >
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); if (emailError) setEmailError(''); }}
                placeholder="New email address"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
              />
              {emailError ? <p className="text-xs text-[color:var(--edu-danger)]">{emailError}</p> : null}
              <div>
                <button
                  type="submit"
                  disabled={!newEmail.trim() || isSavingEmail}
                  className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSavingEmail ? 'Saving...' : 'Update email'}
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-[color:var(--hub-border)]" />

          {/* Change password */}
          <div>
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">Change password</p>
            </div>
            {isDemo ? (
              <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Demo password: <span className="font-mono font-semibold text-[color:var(--hub-text)]">SkillStreamDemo123!</span></p>
            ) : null}
            <form
              className="mt-3 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('All fields are required.'); return; }
                if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
                try {
                  setIsSavingPassword(true);
                  setPasswordError('');
                  await changePassword(currentPassword, newPassword);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  addNotification({ type: 'success', title: 'Password updated', message: 'Your password has been changed.', duration: 2200 });
                } catch (error) {
                  setPasswordError(error instanceof Error ? error.message : 'Could not update password.');
                } finally {
                  setIsSavingPassword(false);
                }
              }}
            >
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                  placeholder="Current password"
                  className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 pr-12 text-sm outline-none focus:border-[color:var(--hub-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--hub-muted)]"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                  placeholder="New password"
                  className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 pr-12 text-sm outline-none focus:border-[color:var(--hub-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--hub-muted)]"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                placeholder="Confirm new password"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
              />

              <p className="text-xs text-[color:var(--hub-muted)]">
                Must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.
              </p>

              {passwordError ? <p className="text-xs text-[color:var(--edu-danger)]">{passwordError}</p> : null}

              <div>
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword || !confirmPassword || isSavingPassword}
                  className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSavingPassword ? 'Saving...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-[color:var(--hub-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">Message and homework alerts</p>
              <p className="text-sm text-[color:var(--hub-muted)]">Keep urgent items visible without noise.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <ToggleRow
              title="Message alerts"
              description="Instant updates for class messages."
              checked={draft.messageAlerts}
              onChange={(value) => setDraft((current) => ({ ...current, messageAlerts: value }))}
            />
            <ToggleRow
              title="Homework alerts"
              description="Reminders for due assignments and reviews."
              checked={draft.homeworkAlerts}
              onChange={(value) => setDraft((current) => ({ ...current, homeworkAlerts: value }))}
            />
            <ToggleRow
              title="Weekly summary reminder"
              description="Sunday summary email-style digest in your inbox."
              checked={draft.weeklyReminder}
              onChange={(value) => setDraft((current) => ({ ...current, weeklyReminder: value }))}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-[color:var(--hub-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">{isStudent ? 'Private learning workspace' : 'Private teaching workspace'}</p>
              <p className="text-sm text-[color:var(--hub-muted)]">No public ranking or social feed noise.</p>
            </div>
          </div>
          <div className="mt-4">
            <ToggleRow
              title="Private workspace mode"
              description="Hide non-essential social visibility and engagement signals."
              checked={draft.privateWorkspace}
              onChange={(value) => setDraft((current) => ({ ...current, privateWorkspace: value }))}
            />
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[color:var(--hub-muted)]">
            {isDirty ? 'You have unsaved preference changes.' : 'All preferences are saved.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={() => setDraft(storedPreferences)}
              className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await updatePreferences(draft, user?.id);
                  addNotification({ type: 'success', title: 'Settings saved', message: 'Your workspace preferences were updated.', duration: 2200 });
                } catch (error) {
                  addNotification({ type: 'error', title: 'Save failed', message: error instanceof Error ? error.message : 'Could not save settings.', duration: 2600 });
                } finally {
                  setIsSaving(false);
                }
              }}
              className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
