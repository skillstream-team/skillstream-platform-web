import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BellRing, Bot, Copy, FileStack, Mail, ShieldCheck, UserCog, Users } from 'lucide-react';
import { ActionModal } from '../components/common/ActionModal';
import { AppPageLoader } from '../components/common/AppPageLoader';
import { useNotifications } from '../components/notifications/NotificationToast';
import { useAdminHubStore } from '../store/adminHub';

type AdminTab = 'overview' | 'people' | 'reports' | 'features' | 'communications' | 'operations';

const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'people', label: 'Teachers & Students', icon: Users },
  { id: 'reports', label: 'Advanced Reports', icon: FileStack },
  { id: 'features', label: 'Feature Controls', icon: Bot },
  { id: 'communications', label: 'Email & Notifications', icon: Mail },
  { id: 'operations', label: 'Operations', icon: ShieldCheck },
];

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export const AdminPage: React.FC = () => {
  const metrics = useAdminHubStore((state) => state.metrics);
  const teachers = useAdminHubStore((state) => state.teachers);
  const students = useAdminHubStore((state) => state.students);
  const reports = useAdminHubStore((state) => state.reports);
  const featureFlags = useAdminHubStore((state) => state.featureFlags);
  const broadcasts = useAdminHubStore((state) => state.broadcasts);
  const alerts = useAdminHubStore((state) => state.alerts);
  const auditEvents = useAdminHubStore((state) => state.auditEvents);
  const teacherInvites = useAdminHubStore((state) => state.teacherInvites);
  const isHydrated = useAdminHubStore((state) => state.isHydrated);
  const isSyncing = useAdminHubStore((state) => state.isSyncing);
  const isLoadingMoreUsers = useAdminHubStore((state) => state.isLoadingMoreUsers);
  const usersHasMore = useAdminHubStore((state) => state.usersHasMore);
  const adminError = useAdminHubStore((state) => state.error);
  const loadAdminHub = useAdminHubStore((state) => state.loadAdminHub);
  const loadMoreUsers = useAdminHubStore((state) => state.loadMoreUsers);
  const createTeacherInvite = useAdminHubStore((state) => state.createTeacherInvite);
  const revokeTeacherInvite = useAdminHubStore((state) => state.revokeTeacherInvite);
  const toggleFeatureFlag = useAdminHubStore((state) => state.toggleFeatureFlag);
  const changeUserStatus = useAdminHubStore((state) => state.changeUserStatus);
  const resolveAlert = useAdminHubStore((state) => state.resolveAlert);
  const sendBroadcast = useAdminHubStore((state) => state.sendBroadcast);
  const saveDraftBroadcast = useAdminHubStore((state) => state.saveDraftBroadcast);
  const generateReportSnapshot = useAdminHubStore((state) => state.generateReportSnapshot);
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [peopleQuery, setPeopleQuery] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportError, setReportError] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAudience, setComposeAudience] = useState<'all' | 'teachers' | 'students'>('all');
  const [composeChannel, setComposeChannel] = useState<'email' | 'in_app'>('email');
  const [composeError, setComposeError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isSubmittingCompose, setIsSubmittingCompose] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    void loadAdminHub();
  }, [loadAdminHub]);

  const userRows = useMemo(() => {
    const all = [...teachers, ...students];
    const normalized = peopleQuery.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter((entry) => `${entry.name} ${entry.email} ${entry.role}`.toLowerCase().includes(normalized));
  }, [peopleQuery, students, teachers]);

  const openAlerts = alerts.filter((alert) => alert.status === 'open');
  const getTeacherInviteLink = (email: string, inviteCode: string) =>
    `${window.location.origin}/register?role=teacher&email=${encodeURIComponent(email)}&invite=${encodeURIComponent(inviteCode)}`;

  if (!isHydrated && isSyncing) {
    return <AppPageLoader message="Loading admin console..." />;
  }

  return (
    <div className="space-y-6">
      {adminError ? (
        <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-4 text-sm text-[color:var(--edu-danger)]">
          {adminError}
        </div>
      ) : null}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Admin Console</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Control the full platform from one workspace.</h2>
        <p className="mt-3 max-w-3xl text-sm text-[color:var(--hub-muted)]">Monitor people, enforce quality, roll out features, and run operational communication with clear audit trails.</p>
      </section>

      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-[color:var(--hub-primary)] text-white'
                : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-muted)]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === 'overview' ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.id} className="rounded-[26px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-sm font-medium text-[color:var(--hub-muted)]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--hub-text)]">{metric.value}</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{metric.note}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                  <Activity className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Open alerts</p>
                </div>
                <span className="rounded-full border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
                  {openAlerts.length} open
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {openAlerts.length > 0 ? openAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-[22px] border border-[color:var(--hub-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{alert.title}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>{alert.severity}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Created {formatDateTime(alert.createdAt)}</p>
                  </div>
                )) : (
                  <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No active alerts.</div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                <BellRing className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Quick actions</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={() => setShowComposeModal(true)} className="rounded-[22px] border border-[color:var(--hub-border)] bg-white px-4 py-3 text-left text-sm font-semibold text-[color:var(--hub-text)]">Craft platform message</button>
              <button type="button" onClick={() => setShowReportModal(true)} className="rounded-[22px] border border-[color:var(--hub-border)] bg-white px-4 py-3 text-left text-sm font-semibold text-[color:var(--hub-text)]">Generate new report snapshot</button>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Latest audit activity</p>
              <div className="mt-3 grid gap-3">
                {auditEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="rounded-[20px] bg-[color:var(--hub-soft)] p-3 text-sm">
                    <p className="font-medium text-[color:var(--hub-text)]">{event.action}</p>
                    <p className="mt-1 text-[color:var(--hub-muted)]">{event.target}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{formatDateTime(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'people' ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                <UserCog className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">People monitoring</p>
              </div>
              <input
                value={peopleQuery}
                onChange={(event) => setPeopleQuery(event.target.value)}
                placeholder="Search teachers or students"
                className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2.5 text-sm outline-none sm:max-w-xs"
              />
            </div>

            <div className="mt-5 grid gap-3">
              {userRows.map((person) => (
                <div key={person.id} className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--hub-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{person.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{person.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{person.role} • {person.classesCount} classes • active {formatDateTime(person.lastActiveAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['active', 'paused', 'needs_attention'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await changeUserStatus(person.id, person.role, status);
                              addNotification({
                                type: 'success',
                                title: 'Status updated',
                                message: `${person.name} is now ${status.replace('_', ' ')}.`,
                                duration: 2200,
                              });
                            } catch (error) {
                              addNotification({
                                type: 'error',
                                title: 'Status update failed',
                                message: error instanceof Error ? error.message : 'Please try again.',
                                duration: 2800,
                              });
                            }
                          })();
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          person.status === status ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {userRows.length === 0 ? (
                <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No matching users.</div>
              ) : null}
              {usersHasMore && !peopleQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => void loadMoreUsers()}
                  disabled={isLoadingMoreUsers}
                  className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] disabled:opacity-50"
                >
                  {isLoadingMoreUsers ? 'Loading...' : 'Load more users'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Teacher invites</p>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Teachers can only sign up with an active invite code.</p>
            <form
              className="mt-4 grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!inviteEmail.trim()) {
                  setInviteError('Invite email is required.');
                  return;
                }
                setInviteError('');
                const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
                try {
                  setIsSubmittingInvite(true);
                  await createTeacherInvite(inviteEmail.trim(), expiry);
                  addNotification({
                    type: 'success',
                    title: 'Invite created',
                    message: 'Teacher invite has been generated for 14 days.',
                    duration: 2200,
                  });
                  setInviteEmail('');
                } catch (error) {
                  setInviteError(error instanceof Error ? error.message : 'Could not create invite.');
                } finally {
                  setIsSubmittingInvite(false);
                }
              }}
            >
              {inviteError ? (
                <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-3 text-sm text-[color:var(--edu-danger)]">
                  {inviteError}
                </div>
              ) : null}
              <input
                value={inviteEmail}
                onChange={(event) => {
                  setInviteEmail(event.target.value);
                  if (inviteError) setInviteError('');
                }}
                placeholder="teacher@school.com"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 text-sm outline-none"
              />
              <button type="submit" disabled={isSubmittingInvite} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmittingInvite ? 'Creating...' : 'Create invite'}
              </button>
            </form>
            <div className="mt-4 grid gap-3">
              {teacherInvites.map((invite) => (
                <div key={invite.id} className="rounded-[20px] border border-[color:var(--hub-border)] p-3">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{invite.email}</p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--hub-muted)]">{invite.inviteCode}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{invite.status} • {formatDateTime(invite.createdAt)}</p>
                  {invite.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const inviteLink = getTeacherInviteLink(invite.email, invite.inviteCode);
                        void navigator.clipboard?.writeText(inviteLink);
                        addNotification({
                          type: 'success',
                          title: 'Invite link copied',
                          message: 'Share this link with the teacher to complete signup.',
                          duration: 2200,
                        });
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy signup link
                    </button>
                  ) : null}
                  {invite.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await revokeTeacherInvite(invite.id);
                            addNotification({
                              type: 'info',
                              title: 'Invite revoked',
                              message: 'This invite can no longer be used.',
                              duration: 2200,
                            });
                          } catch (error) {
                            addNotification({
                              type: 'error',
                              title: 'Could not revoke invite',
                              message: error instanceof Error ? error.message : 'Please try again.',
                              duration: 2800,
                            });
                          }
                        })();
                      }}
                      className="mt-2 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              ))}
              {teacherInvites.length === 0 ? (
                <div className="rounded-[20px] bg-[color:var(--hub-soft)] p-3 text-sm text-[color:var(--hub-muted)]">No invite history yet.</div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'reports' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Advanced reporting</p>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Generate snapshots for engagement, quality, and learner risk.</p>
            </div>
            <button type="button" onClick={() => setShowReportModal(true)} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">Generate report</button>
          </div>
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-[26px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold text-[color:var(--hub-text)]">{report.name}</p>
                <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{report.description}</p>
                <p className="mt-3 text-sm font-semibold text-[color:var(--hub-primary)]">{report.kpi}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Generated {formatDateTime(report.generatedAt)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'features' ? (
        <section className="grid gap-4">
          {featureFlags.map((flag) => (
            <div key={flag.id} className="rounded-[26px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{flag.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{flag.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Rollout: {flag.rollout} • Updated {formatDateTime(flag.updatedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        await toggleFeatureFlag(flag.id);
                        addNotification({
                          type: 'info',
                          title: 'Feature updated',
                          message: `${flag.name} is now ${flag.enabled ? 'off' : 'on'}.`,
                          duration: 2200,
                        });
                      } catch (error) {
                        addNotification({
                          type: 'error',
                          title: 'Feature update failed',
                          message: error instanceof Error ? error.message : 'Please try again.',
                          duration: 2800,
                        });
                      }
                    })();
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    flag.enabled ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]'
                  }`}
                >
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {activeTab === 'communications' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Comms center</p>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Craft platform emails and in-app notices for targeted audiences.</p>
            </div>
            <button type="button" onClick={() => setShowComposeModal(true)} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">New message</button>
          </div>
          <div className="grid gap-4">
            {broadcasts.map((item) => (
              <div key={item.id} className="rounded-[26px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{item.subject}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{item.body}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{item.channel.replace('_', ' ')} • {item.audience} • {formatDateTime(item.sentAt)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'operations' ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Alert queue</p>
            <div className="mt-4 grid gap-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-[22px] border border-[color:var(--hub-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{alert.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{alert.status} • {formatDateTime(alert.createdAt)}</p>
                  {alert.status === 'open' ? (
                    <button
                      type="button"
                      onClick={() => {
                        void resolveAlert(alert.id);
                        addNotification({
                          type: 'success',
                          title: 'Alert resolved',
                          message: 'The alert was moved to resolved.',
                          duration: 2000,
                        });
                      }}
                      className="mt-3 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
                    >
                      Mark resolved
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Audit log</p>
            <div className="mt-4 grid gap-3">
              {auditEvents.map((event) => (
                <div key={event.id} className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm">
                  <p className="font-semibold text-[color:var(--hub-text)]">{event.action}</p>
                  <p className="mt-1 text-[color:var(--hub-muted)]">{event.target}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{event.actor} • {formatDateTime(event.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ActionModal
        isOpen={showComposeModal}
        title="Craft platform message"
        description="Compose and target email or in-app communications."
        onClose={() => {
          setComposeError('');
          setShowComposeModal(false);
        }}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!composeSubject.trim() || !composeBody.trim()) {
              setComposeError('Subject and message body are required to send.');
              return;
            }
            setComposeError('');
            try {
              setIsSubmittingCompose(true);
              await sendBroadcast({
                channel: composeChannel,
                audience: composeAudience,
                subject: composeSubject.trim(),
                body: composeBody.trim(),
              });
              addNotification({
                type: 'success',
                title: 'Message sent',
                message: 'Broadcast was delivered to the selected audience.',
                duration: 2200,
              });
              setComposeSubject('');
              setComposeBody('');
              setComposeAudience('all');
              setComposeChannel('email');
              setShowComposeModal(false);
            } catch (error) {
              setComposeError(error instanceof Error ? error.message : 'Could not send message.');
            } finally {
              setIsSubmittingCompose(false);
            }
          }}
        >
          {composeError ? (
            <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-3 text-sm text-[color:var(--edu-danger)]">
              {composeError}
            </div>
          ) : null}
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-[color:var(--hub-text)]">Audience</label>
            <select value={composeAudience} onChange={(event) => setComposeAudience(event.target.value as 'all' | 'teachers' | 'students')} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
              <option value="all">All users</option>
              <option value="teachers">Teachers only</option>
              <option value="students">Students only</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-[color:var(--hub-text)]">Channel</label>
            <select value={composeChannel} onChange={(event) => setComposeChannel(event.target.value as 'email' | 'in_app')} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
              <option value="email">Email</option>
              <option value="in_app">In-app notification</option>
            </select>
          </div>
          <input value={composeSubject} onChange={(event) => setComposeSubject(event.target.value)} placeholder="Subject" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <textarea value={composeBody} onChange={(event) => setComposeBody(event.target.value)} rows={5} placeholder="Write the message body" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!composeSubject.trim() || !composeBody.trim()) {
                  setComposeError('Subject and message body are required to save a draft.');
                  return;
                }
                setComposeError('');
                void (async () => {
                  try {
                    setIsSavingDraft(true);
                    await saveDraftBroadcast({
                      channel: composeChannel,
                      audience: composeAudience,
                      subject: composeSubject.trim(),
                      body: composeBody.trim(),
                    });
                    addNotification({
                      type: 'info',
                      title: 'Draft saved',
                      message: 'Your broadcast draft was saved.',
                      duration: 2200,
                    });
                    setShowComposeModal(false);
                  } catch (error) {
                    setComposeError(error instanceof Error ? error.message : 'Could not save draft.');
                  } finally {
                    setIsSavingDraft(false);
                  }
                })();
              }}
              disabled={isSavingDraft || isSubmittingCompose}
              className="rounded-full border border-[color:var(--hub-border)] px-4 py-3 text-sm font-semibold text-[color:var(--hub-text)] disabled:opacity-60"
            >
              {isSavingDraft ? 'Saving...' : 'Save draft'}
            </button>
            <button type="submit" disabled={isSubmittingCompose || isSavingDraft} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmittingCompose ? 'Sending...' : 'Send now'}
            </button>
          </div>
        </form>
      </ActionModal>

      <ActionModal
        isOpen={showReportModal}
        title="Generate report snapshot"
        description="Capture an on-demand analytics snapshot for admin review."
        onClose={() => {
          setReportError('');
          setShowReportModal(false);
        }}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!reportName.trim()) {
              setReportError('Report name is required.');
              return;
            }
            setReportError('');
            try {
              setIsGeneratingReport(true);
              await generateReportSnapshot(reportName.trim());
              addNotification({
                type: 'success',
                title: 'Report generated',
                message: 'A new report snapshot is now available.',
                duration: 2200,
              });
              setReportName('');
              setShowReportModal(false);
            } catch (error) {
              setReportError(error instanceof Error ? error.message : 'Could not generate report.');
            } finally {
              setIsGeneratingReport(false);
            }
          }}
        >
          {reportError ? (
            <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-3 text-sm text-[color:var(--edu-danger)]">
              {reportError}
            </div>
          ) : null}
          <input
            value={reportName}
            onChange={(event) => {
              setReportName(event.target.value);
              if (reportError) setReportError('');
            }}
            placeholder="Report name"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <button type="submit" disabled={isGeneratingReport} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isGeneratingReport ? 'Generating...' : 'Generate'}</button>
        </form>
      </ActionModal>
    </div>
  );
};
