import React, { useEffect, useState } from 'react';
import { BellRing, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { WorkspacePreferences, usePreferencesStore } from '../store/preferences';
import { useNotifications } from '../components/notifications/NotificationToast';
import { getInitials } from '../lib/utils';

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
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-[color:var(--hub-primary)]' : 'bg-[rgba(100,116,139,0.35)]'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isStudent = user?.role === 'STUDENT';
  const storedPreferences = usePreferencesStore((state) => state.preferences);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const { addNotification } = useNotifications();

  const [draft, setDraft] = useState<WorkspacePreferences>(storedPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const isNameDirty = displayName.trim() !== (user?.name || '');

  useEffect(() => {
    setDraft(storedPreferences);
  }, [storedPreferences]);

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user?.name]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(storedPreferences);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
          {isStudent ? 'Keep your learning setup simple.' : 'Keep the teaching workspace focused.'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[color:var(--hub-muted)]">
          {isStudent
            ? 'Control alerts, reminders, and account visibility.'
            : 'Control alerts, scheduling defaults, and classroom privacy.'}
        </p>
      </section>

      {/* Profile */}
      <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-5 w-5 text-[color:var(--hub-primary)]" />
          <div>
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Profile</p>
            <p className="text-sm text-[color:var(--hub-muted)]">Your name and account details.</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-base font-bold text-white">
            {getInitials(user?.name || user?.email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{user?.name}</p>
            <p className="truncate text-xs text-[color:var(--hub-muted)]">{user?.email}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{user?.role}</p>
          </div>
        </div>
        <form
          className="mt-5 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmed = displayName.trim();
            if (!trimmed) {
              setProfileError('Display name cannot be empty.');
              return;
            }
            try {
              setIsSavingProfile(true);
              setProfileError('');
              await updateUser({ name: trimmed });
              addNotification({
                type: 'success',
                title: 'Profile updated',
                message: 'Your display name has been saved.',
                duration: 2200,
              });
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
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (profileError) setProfileError('');
              }}
              placeholder="Your full name"
              className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
            />
          </label>
          {profileError ? <p className="text-xs text-[color:var(--edu-danger)]">{profileError}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!isNameDirty || isSavingProfile}
              className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Save name'}
            </button>
            {isNameDirty ? (
              <button
                type="button"
                onClick={() => {
                  setDisplayName(user?.name || '');
                  setProfileError('');
                }}
                className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
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
            <Sparkles className="h-5 w-5 text-[color:var(--hub-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">{isStudent ? 'Study helper' : 'Planning helper'}</p>
              <p className="text-sm text-[color:var(--hub-muted)]">
                {isStudent ? 'Get recap and revision prompts.' : 'Generate lesson and follow-up outlines.'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ToggleRow
              title="Enable helper suggestions"
              description={isStudent ? 'Show study assist suggestions on dashboard.' : 'Show planning hints and shortcuts.'}
              checked={draft.aiHelper}
              onChange={(value) => setDraft((current) => ({ ...current, aiHelper: value }))}
            />
          </div>
        </div>
        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[color:var(--hub-primary)]" />
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
                  addNotification({
                    type: 'success',
                    title: 'Settings saved',
                    message: 'Your workspace preferences were updated.',
                    duration: 2200,
                  });
                } catch (error) {
                  addNotification({
                    type: 'error',
                    title: 'Save failed',
                    message: error instanceof Error ? error.message : 'Could not save settings.',
                    duration: 2600,
                  });
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
