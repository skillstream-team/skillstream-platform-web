import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, Building2, Calendar, KeyRound, Shield } from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { useOrgHubStore } from '../../store/orgHub';

export const OrgSettingsPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { addNotification } = useNotifications();
  const { org, members, enrollments, isHydrated, isSyncing, loadOrgHub, updateOrgDetails } = useOrgHubStore();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState('3');
  const [ssoProvider, setSsoProvider] = useState('');
  const [ssoIdpUrl, setSsoIdpUrl] = useState('');
  const [ssoEntityId, setSsoEntityId] = useState('');
  const [ssoCertificate, setSsoCertificate] = useState('');
  const [reportEnabled, setReportEnabled] = useState(false);
  const [reportFrequency, setReportFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [reportEmail, setReportEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setLogoUrl(org.logoUrl ?? '');
      setRemindersEnabled(org.remindersEnabled);
      setReminderDays(String(org.reminderDaysBefore));
      setSsoProvider(org.ssoProvider ?? '');
      setSsoIdpUrl(org.ssoIdpUrl ?? '');
      setSsoEntityId(org.ssoEntityId ?? '');
      setSsoCertificate(org.ssoCertificate ?? '');
      setReportEnabled(org.reportScheduleEnabled ?? false);
      setReportFrequency(org.reportScheduleFrequency ?? 'weekly');
      setReportEmail(org.reportScheduleEmail ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id]);

  const save = async (section: string, data: Parameters<typeof updateOrgDetails>[0]) => {
    try {
      setIsSaving(true); setSavingSection(section);
      await updateOrgDetails(data);
      addNotification({ type: 'success', title: 'Saved', message: '', duration: 1800 });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not save.', duration: 2500 });
    } finally { setIsSaving(false); setSavingSection(null); }
  };

  if (!isHydrated || isSyncing) {
    return <div className="h-64 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  }

  const learnerCount = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager').length;
  const completedCount = enrollments.filter((e) => e.completedAt).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Configuration</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Settings</h2>
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-[color:var(--hub-muted)]">
          <span><span className="font-semibold text-[color:var(--hub-text)]">{learnerCount}</span> / {org?.seatLimit} seats</span>
          <span><span className="font-semibold text-[color:var(--hub-text)]">{completedCount}</span> completions</span>
          <span>Slug: <span className="font-mono text-[color:var(--hub-text)]">{org?.slug}</span></span>
        </div>
      </section>

      {/* General */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">General</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void save('general', { name: name.trim(), logoUrl: logoUrl.trim() || undefined }); }} className="grid max-w-lg gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Organisation name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Logo URL</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
            {logoUrl ? <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-auto rounded-lg object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Shown in the sidebar for your org members.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Seat limit</label>
            <p className="rounded-2xl bg-[color:var(--hub-soft)] px-4 py-3 text-sm text-[color:var(--hub-text)]">{org?.seatLimit} seats</p>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Contact support to adjust your seat limit.</p>
          </div>
          <button type="submit" disabled={isSaving} className="justify-self-start rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {savingSection === 'general' && isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Deadline reminders */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Deadline reminders</p>
        </div>
        <p className="mb-4 text-sm text-[color:var(--hub-muted)]">Automatically email learners before their course deadlines. Reminders are sent once per learner per course.</p>
        <form onSubmit={(e) => { e.preventDefault(); void save('reminders', { remindersEnabled, reminderDaysBefore: parseInt(reminderDays) || 3 }); }} className="grid max-w-lg gap-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className={`relative h-6 w-11 rounded-full transition ${remindersEnabled ? 'bg-[color:var(--hub-primary)]' : 'bg-[color:var(--hub-border)]'}`} onClick={() => setRemindersEnabled((v) => !v)}>
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${remindersEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-semibold text-[color:var(--hub-text)]">{remindersEnabled ? 'Reminders enabled' : 'Reminders disabled'}</span>
          </label>
          {remindersEnabled ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Days before deadline</label>
              <select value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
                {[1, 2, 3, 5, 7, 14].map((d) => <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''} before</option>)}
              </select>
            </div>
          ) : null}
          <button type="submit" disabled={isSaving} className="justify-self-start rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {savingSection === 'reminders' && isSaving ? 'Saving...' : 'Save reminder settings'}
          </button>
        </form>
      </div>

      {/* Scheduled reports */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Scheduled reports</p>
        </div>
        <p className="mb-5 text-sm text-[color:var(--hub-muted)]">Automatically email a completion and compliance summary to an inbox on a regular schedule.</p>
        <form onSubmit={(e) => { e.preventDefault(); void save('reports', { reportScheduleEnabled: reportEnabled, reportScheduleFrequency: reportFrequency, reportScheduleEmail: reportEmail }); }} className="grid max-w-lg gap-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className={`relative h-6 w-11 rounded-full transition ${reportEnabled ? 'bg-[color:var(--hub-primary)]' : 'bg-[color:var(--hub-border)]'}`} onClick={() => setReportEnabled((v) => !v)}>
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reportEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-semibold text-[color:var(--hub-text)]">{reportEnabled ? 'Scheduled reports enabled' : 'Scheduled reports disabled'}</span>
          </label>
          {reportEnabled ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Frequency</label>
                <select value={reportFrequency} onChange={(e) => setReportFrequency(e.target.value as 'weekly' | 'monthly')} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
                  <option value="weekly">Weekly (every Monday)</option>
                  <option value="monthly">Monthly (1st of month)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Recipient email</label>
                <input type="email" value={reportEmail} onChange={(e) => setReportEmail(e.target.value)} placeholder="admin@company.com" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
              </div>
            </>
          ) : null}
          <button type="submit" disabled={isSaving} className="justify-self-start rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {savingSection === 'reports' && isSaving ? 'Saving...' : 'Save report settings'}
          </button>
        </form>
      </div>

      {/* SSO */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Single Sign-On (SSO)</p>
        </div>
        <p className="mb-5 text-sm text-[color:var(--hub-muted)]">Connect your identity provider so employees log in with their company credentials. Supports SAML 2.0 (Okta, Azure AD, Google Workspace, and more).</p>
        <form onSubmit={(e) => { e.preventDefault(); void save('sso', { ssoProvider: ssoProvider || undefined, ssoIdpUrl: ssoIdpUrl || undefined, ssoEntityId: ssoEntityId || undefined, ssoCertificate: ssoCertificate || undefined }); }} className="grid max-w-lg gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Identity provider</label>
            <select value={ssoProvider} onChange={(e) => setSsoProvider(e.target.value)} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
              <option value="">Not configured</option>
              <option value="okta">Okta</option>
              <option value="azure">Microsoft Azure AD</option>
              <option value="google">Google Workspace</option>
              <option value="onelogin">OneLogin</option>
              <option value="saml">Other SAML 2.0 provider</option>
            </select>
          </div>
          {ssoProvider ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">IdP SSO URL</label>
                <input value={ssoIdpUrl} onChange={(e) => setSsoIdpUrl(e.target.value)} placeholder="https://your-idp.example.com/sso/saml" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Entity ID / Issuer</label>
                <input value={ssoEntityId} onChange={(e) => setSsoEntityId(e.target.value)} placeholder="https://your-idp.example.com/entity-id" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">X.509 Certificate</label>
                <textarea value={ssoCertificate} onChange={(e) => setSsoCertificate(e.target.value)} rows={4} placeholder="Paste the base64-encoded certificate from your IdP metadata..." className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 font-mono text-xs outline-none resize-none" />
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Service Provider details (configure in your IdP)</p>
                    <p>ACS URL: <span className="font-mono">https://app.skillstream.io/auth/saml/callback/{org?.slug}</span></p>
                    <p className="mt-0.5">Entity ID: <span className="font-mono">https://app.skillstream.io/auth/saml/{org?.slug}</span></p>
                    <p className="mt-2 text-amber-700">SSO activation requires an Enterprise plan. Save your configuration and contact support to enable.</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          <button type="submit" disabled={isSaving} className="justify-self-start rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {savingSection === 'sso' && isSaving ? 'Saving...' : 'Save SSO settings'}
          </button>
        </form>
      </div>
    </div>
  );
};
