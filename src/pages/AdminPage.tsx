import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BellRing, Bot, Check, Copy, CreditCard, DollarSign, Edit3, FileStack, Loader2, Mail, Percent, Plus, RefreshCw, ShieldCheck, Tag, Trash2, UserCog, Users, Users2, X } from 'lucide-react';
import { ActionModal } from '../components/common/ActionModal';
import { AppPageLoader } from '../components/common/AppPageLoader';
import { useNotifications } from '../components/notifications/NotificationToast';
import { BillingPlan, PromoCode } from '../data/adminHub';
import { useAdminHubStore } from '../store/adminHub';
import { SUPPORTED_CURRENCIES, useCurrencyStore } from '../store/currency';
import { useCurrencyFormatter } from '../lib/currency';
import { cn } from '../lib/utils';

type AdminTab = 'overview' | 'people' | 'billing' | 'promotions' | 'affiliates' | 'reports' | 'features' | 'communications' | 'operations';

const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'people', label: 'Teachers & Students', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'promotions', label: 'Promotions', icon: Tag },
  { id: 'affiliates', label: 'Affiliates', icon: Users2 },
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
  const updateFeatureFlagRollout = useAdminHubStore((state) => state.updateFeatureFlagRollout);
  const changeUserStatus = useAdminHubStore((state) => state.changeUserStatus);
  const resolveAlert = useAdminHubStore((state) => state.resolveAlert);
  const sendBroadcast = useAdminHubStore((state) => state.sendBroadcast);
  const saveDraftBroadcast = useAdminHubStore((state) => state.saveDraftBroadcast);
  const generateReportSnapshot = useAdminHubStore((state) => state.generateReportSnapshot);
  const billingPlans = useAdminHubStore((state) => state.billingPlans);
  const teacherSubscriptions = useAdminHubStore((state) => state.teacherSubscriptions);
  const updateBillingPlan = useAdminHubStore((state) => state.updateBillingPlan);
  const cancelTeacherSubscription = useAdminHubStore((state) => state.cancelTeacherSubscription);
  const overrideTeacherPlan = useAdminHubStore((state) => state.overrideTeacherPlan);
  const promoCodes = useAdminHubStore((state) => state.promoCodes);
  const affiliateCodes = useAdminHubStore((state) => state.affiliateCodes);
  const affiliateDiscountReferrer = useAdminHubStore((state) => state.affiliateDiscountReferrer);
  const affiliateDiscountReferee = useAdminHubStore((state) => state.affiliateDiscountReferee);
  const createPromoCode = useAdminHubStore((state) => state.createPromoCode);
  const togglePromoCode = useAdminHubStore((state) => state.togglePromoCode);
  const deletePromoCode = useAdminHubStore((state) => state.deletePromoCode);
  const updateAffiliateRates = useAdminHubStore((state) => state.updateAffiliateRates);
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const { format: formatMoney, formatPrecise: formatMoneyPrecise } = useCurrencyFormatter();
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
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planEdits, setPlanEdits] = useState<Partial<BillingPlan>>({});
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [overridingSubId, setOverridingSubId] = useState<string | null>(null);

  // Promotions state
  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState<{
    code: string; description: string; discountPercent: string; maxUses: string;
    validFrom: string; validUntil: string; appliesTo: PromoCode['appliesTo'];
  }>({ code: '', description: '', discountPercent: '10', maxUses: '', validFrom: new Date().toISOString().slice(0, 10), validUntil: '', appliesTo: 'all' });
  const [promoFormError, setPromoFormError] = useState('');
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [togglingPromoId, setTogglingPromoId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);

  const [savingCurrency, setSavingCurrency] = useState(false);

  // Affiliates state
  const [editingRates, setEditingRates] = useState(false);
  const [rateReferrer, setRateReferrer] = useState('');
  const [rateReferee, setRateReferee] = useState('');
  const [isSavingRates, setIsSavingRates] = useState(false);

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

  const handleCurrencyChange = async (code: string) => {
    try {
      setSavingCurrency(true);
      await setCurrency(code);
      addNotification({ type: 'success', title: 'Currency updated', message: `Platform currency set to ${code}.`, duration: 2200 });
    } catch {
      addNotification({ type: 'error', title: 'Update failed', message: 'Could not save currency. Try again.', duration: 2800 });
    } finally {
      setSavingCurrency(false);
    }
  };

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Admin Console</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Control the full platform from one workspace.</h2>
            <p className="mt-3 max-w-3xl text-sm text-[color:var(--hub-muted)]">Monitor people, enforce quality, roll out features, and run operational communication with clear audit trails.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadAdminHub()}
            disabled={isSyncing}
            className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold text-[color:var(--hub-muted)] transition hover:text-[color:var(--hub-text)] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing ? 'animate-spin' : '')} />
            Sync
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition', activeTab === tab.id ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-muted)]')}
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
                      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700')}>{alert.severity}</span>
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
                        className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', person.status === status ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]')}
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
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Updated {formatDateTime(flag.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={flag.rollout}
                    onChange={(e) => void updateFeatureFlagRollout(flag.id, e.target.value as 'all' | 'teachers' | 'students')}
                    className="rounded-2xl border border-[color:var(--hub-border)] px-3 py-2 text-xs font-semibold text-[color:var(--hub-text)] outline-none"
                  >
                    <option value="all">All users</option>
                    <option value="teachers">Teachers only</option>
                    <option value="students">Students only</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          await toggleFeatureFlag(flag.id);
                          addNotification({ type: 'info', title: 'Feature updated', message: `${flag.name} is now ${flag.enabled ? 'off' : 'on'}.`, duration: 2200 });
                        } catch (error) {
                          addNotification({ type: 'error', title: 'Feature update failed', message: error instanceof Error ? error.message : 'Please try again.', duration: 2800 });
                        }
                      })();
                    }}
                    className={cn('rounded-full px-4 py-2 text-sm font-semibold', flag.enabled ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]')}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
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
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', item.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700')}>{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{item.body}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{item.channel.replace('_', ' ')} • {item.audience} • {formatDateTime(item.sentAt)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'billing' ? (
        <section className="space-y-6">
          {/* Platform currency */}
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Platform currency</p>
            </div>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">
              All prices, fees, and ticket amounts are displayed in this currency across the platform. Takes effect immediately for all users.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <select
                value={currency}
                onChange={(e) => { void handleCurrencyChange(e.target.value); }}
                disabled={savingCurrency}
                className="rounded-2xl border border-[color:var(--hub-border)] bg-white px-4 py-3 text-sm text-[color:var(--hub-text)] outline-none focus:border-[color:var(--hub-primary)] disabled:opacity-60"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
              {savingCurrency ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--hub-muted)]" /> : null}
            </div>
          </div>

          {/* Plan tier editor */}
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <CreditCard className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Plan tiers</p>
            </div>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Edit plan pricing, minute quotas, and AI token limits. Changes take effect on next billing cycle.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {billingPlans.map((plan) => {
                const isEditing = editingPlanId === plan.id;
                const edits = isEditing ? planEdits : {};
                const val = <K extends keyof BillingPlan>(key: K) => ((edits as Partial<BillingPlan>)[key] ?? plan[key]) as BillingPlan[K];
                return (
                  <div key={plan.id} className={cn('rounded-3xl border p-5 transition', isEditing ? 'border-[color:var(--hub-primary)] bg-[color:var(--hub-soft)]' : 'border-[color:var(--hub-border)]')}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[color:var(--hub-text)]">{plan.name}</p>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => { setEditingPlanId(plan.id); setPlanEdits({}); }}
                          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-muted)]"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 grid gap-2.5">
                        {[
                          { label: `Monthly fee (${currency})`, key: 'monthlyFeeGbp' as const, step: '0.01' },
                          { label: 'Included minutes', key: 'includedParticipantMinutes' as const, step: '1' },
                          { label: `Overage per minute (${currency})`, key: 'overagePerParticipantMinuteGbp' as const, step: '0.001' },
                          { label: 'Platform fee (%)', key: 'oneOffPlatformFeePercent' as const, step: '0.1' },
                          { label: 'AI tokens / month', key: 'aiMonthlyTokenLimit' as const, step: '1000' },
                        ].map(({ label, key, step }) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs font-medium text-[color:var(--hub-muted)]">{label}</label>
                            <input
                              type="number"
                              step={step}
                              min="0"
                              value={val(key) as number}
                              onChange={(e) => setPlanEdits((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                              className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-white px-3 py-2 text-sm outline-none"
                            />
                          </div>
                        ))}
                        <div className="mt-1 flex gap-2">
                          <button
                            type="button"
                            disabled={isSavingPlan}
                            onClick={() => {
                              void (async () => {
                                try {
                                  setIsSavingPlan(true);
                                  await updateBillingPlan(plan.id, planEdits);
                                  addNotification({ type: 'success', title: 'Plan updated', message: `${plan.name} plan was saved.`, duration: 2200 });
                                  setEditingPlanId(null);
                                } catch (err) {
                                  addNotification({ type: 'error', title: 'Update failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                                } finally {
                                  setIsSavingPlan(false);
                                }
                              })();
                            }}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--hub-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {isSavingPlan ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isSavingPlan}
                            onClick={() => setEditingPlanId(null)}
                            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hub-border)] px-3 py-2 text-xs font-semibold text-[color:var(--hub-text)] disabled:opacity-60"
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-1 text-sm text-[color:var(--hub-muted)]">
                        <li>{formatMoney(plan.monthlyFeeGbp)} / month</li>
                        <li>{new Intl.NumberFormat('en-US').format(plan.includedParticipantMinutes)} participant-minutes</li>
                        <li>{formatMoneyPrecise(plan.overagePerParticipantMinuteGbp)} per extra minute</li>
                        <li>{plan.oneOffPlatformFeePercent}% platform fee</li>
                        <li>{new Intl.NumberFormat('en-US').format(plan.aiMonthlyTokenLimit)} AI tokens</li>
                      </ul>
                    )}
                  </div>
                );
              })}
              {billingPlans.length === 0 ? (
                <div className="col-span-3 rounded-3xl bg-[color:var(--hub-soft)] p-6 text-sm text-[color:var(--hub-muted)]">No billing plans found.</div>
              ) : null}
            </div>
          </div>

          {/* Teacher subscriptions */}
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Teacher subscriptions</p>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">View and manage all active teacher subscriptions. Cancel or override plan assignment.</p>
            <div className="mt-5 grid gap-3">
              {teacherSubscriptions.map((sub) => (
                <div key={sub.id} className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--hub-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{sub.teacherName}</p>
                    <p className="mt-0.5 text-sm text-[color:var(--hub-muted)]">{sub.teacherEmail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[color:var(--hub-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--hub-text)]">{sub.planName}</span>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : sub.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{sub.status}</span>
                      {sub.periodEnd ? (
                        <span className="text-xs text-[color:var(--hub-muted)]">
                          renews {new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(sub.periodEnd))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={sub.planId}
                      disabled={overridingSubId === sub.id || sub.status === 'cancelled'}
                      onChange={(e) => {
                        const newPlanId = e.target.value;
                        if (newPlanId === sub.planId) return;
                        void (async () => {
                          try {
                            setOverridingSubId(sub.id);
                            await overrideTeacherPlan(sub.id, newPlanId);
                            addNotification({ type: 'success', title: 'Plan changed', message: `${sub.teacherName} moved to ${billingPlans.find((p) => p.id === newPlanId)?.name || newPlanId}.`, duration: 2200 });
                          } catch (err) {
                            addNotification({ type: 'error', title: 'Plan change failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                          } finally {
                            setOverridingSubId(null);
                          }
                        })();
                      }}
                      className="rounded-2xl border border-[color:var(--hub-border)] px-3 py-2 text-xs font-semibold text-[color:var(--hub-text)] disabled:opacity-50"
                    >
                      {billingPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {overridingSubId === sub.id ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--hub-primary)]" /> : null}
                    {sub.status !== 'cancelled' ? (
                      <button
                        type="button"
                        disabled={cancellingSubId === sub.id}
                        onClick={() => {
                          void (async () => {
                            try {
                              setCancellingSubId(sub.id);
                              await cancelTeacherSubscription(sub.id);
                              addNotification({ type: 'info', title: 'Subscription cancelled', message: `${sub.teacherName}'s subscription was cancelled.`, duration: 2200 });
                            } catch (err) {
                              addNotification({ type: 'error', title: 'Cancel failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                            } finally {
                              setCancellingSubId(null);
                            }
                          })();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                      >
                        {cancellingSubId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {teacherSubscriptions.length === 0 ? (
                <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No active subscriptions yet.</div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'promotions' ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div>
              <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                <Tag className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Promo codes</p>
              </div>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Create discount codes for checkout. Toggle codes on/off without deleting them.</p>
            </div>
            <button
              type="button"
              onClick={() => { setPromoFormError(''); setShowCreatePromoModal(true); }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New code
            </button>
          </div>

          <div className="grid gap-3">
            {promoCodes.map((code) => (
              <div key={code.id} className="rounded-[26px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-wider text-[color:var(--hub-text)]">{code.code}</span>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', code.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="rounded-full border border-[color:var(--hub-border)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--hub-text)]">
                        {code.appliesTo === 'all' ? 'All plans' : code.appliesTo.charAt(0).toUpperCase() + code.appliesTo.slice(1)}
                      </span>
                    </div>
                    {code.description ? (
                      <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{code.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[color:var(--hub-muted)]">
                      <span className="font-semibold text-[color:var(--hub-primary)]">{code.discountPercent}% off</span>
                      <span>{code.usedCount}{code.maxUses != null ? `/${code.maxUses}` : ''} uses</span>
                      {code.validUntil ? <span>Expires {new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(code.validUntil))}</span> : <span>No expiry</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={togglingPromoId === code.id}
                      onClick={() => {
                        void (async () => {
                          try {
                            setTogglingPromoId(code.id);
                            await togglePromoCode(code.id);
                            addNotification({ type: 'info', title: 'Code updated', message: `${code.code} is now ${code.isActive ? 'inactive' : 'active'}.`, duration: 2000 });
                          } catch (err) {
                            addNotification({ type: 'error', title: 'Update failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                          } finally {
                            setTogglingPromoId(null);
                          }
                        })();
                      }}
                      className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50', code.isActive ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]')}
                    >
                      {togglingPromoId === code.id ? <Loader2 className="h-3 w-3 animate-spin" /> : code.isActive ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingPromoId === code.id}
                      onClick={() => {
                        void (async () => {
                          try {
                            setDeletingPromoId(code.id);
                            await deletePromoCode(code.id);
                            addNotification({ type: 'info', title: 'Code deleted', message: `${code.code} was removed.`, duration: 2000 });
                          } catch (err) {
                            addNotification({ type: 'error', title: 'Delete failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                          } finally {
                            setDeletingPromoId(null);
                          }
                        })();
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                    >
                      {deletingPromoId === code.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {promoCodes.length === 0 ? (
              <div className="rounded-[26px] bg-[color:var(--hub-soft)] p-6 text-sm text-[color:var(--hub-muted)]">No promo codes yet. Create one to get started.</div>
            ) : null}
          </div>

          <ActionModal
            isOpen={showCreatePromoModal}
            title="Create promo code"
            description="Set up a discount code for teacher subscriptions at checkout."
            onClose={() => { setPromoFormError(''); setShowCreatePromoModal(false); }}
          >
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const discountNum = parseFloat(promoForm.discountPercent);
                if (!promoForm.code.trim()) { setPromoFormError('Code is required.'); return; }
                if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) { setPromoFormError('Discount must be between 1 and 100.'); return; }
                setPromoFormError('');
                void (async () => {
                  try {
                    setIsCreatingPromo(true);
                    await createPromoCode({
                      code: promoForm.code.trim().toUpperCase(),
                      description: promoForm.description.trim(),
                      discountPercent: discountNum,
                      maxUses: promoForm.maxUses ? parseInt(promoForm.maxUses, 10) : null,
                      validFrom: promoForm.validFrom || new Date().toISOString(),
                      validUntil: promoForm.validUntil || null,
                      isActive: true,
                      appliesTo: promoForm.appliesTo,
                    });
                    addNotification({ type: 'success', title: 'Promo code created', message: `${promoForm.code.toUpperCase()} is now active.`, duration: 2200 });
                    setPromoForm({ code: '', description: '', discountPercent: '10', maxUses: '', validFrom: new Date().toISOString().slice(0, 10), validUntil: '', appliesTo: 'all' });
                    setShowCreatePromoModal(false);
                  } catch (err) {
                    setPromoFormError(err instanceof Error ? err.message : 'Could not create code.');
                  } finally {
                    setIsCreatingPromo(false);
                  }
                })();
              }}
            >
              {promoFormError ? (
                <div className="rounded-2xl border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] p-3 text-sm text-[color:var(--edu-danger)]">{promoFormError}</div>
              ) : null}
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[color:var(--hub-text)]">Code</label>
                <input value={promoForm.code} onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. LAUNCH20" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 font-mono uppercase outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[color:var(--hub-text)]">Description (optional)</label>
                <input value={promoForm.description} onChange={(e) => setPromoForm((p) => ({ ...p, description: e.target.value }))} placeholder="e.g. Launch discount" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Discount %</label>
                  <input type="number" min="1" max="100" step="0.5" value={promoForm.discountPercent} onChange={(e) => setPromoForm((p) => ({ ...p, discountPercent: e.target.value }))} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Max uses (optional)</label>
                  <input type="number" min="1" step="1" value={promoForm.maxUses} onChange={(e) => setPromoForm((p) => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Valid from</label>
                  <input type="date" value={promoForm.validFrom} onChange={(e) => setPromoForm((p) => ({ ...p, validFrom: e.target.value }))} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Expires (optional)</label>
                  <input type="date" value={promoForm.validUntil} onChange={(e) => setPromoForm((p) => ({ ...p, validUntil: e.target.value }))} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[color:var(--hub-text)]">Applies to</label>
                <select value={promoForm.appliesTo} onChange={(e) => setPromoForm((p) => ({ ...p, appliesTo: e.target.value as PromoCode['appliesTo'] }))} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
                  <option value="all">All plans</option>
                  <option value="creator">Creator only</option>
                  <option value="studio">Studio only</option>
                  <option value="academy">Academy only</option>
                </select>
              </div>
              <button type="submit" disabled={isCreatingPromo} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {isCreatingPromo ? 'Creating...' : 'Create code'}
              </button>
            </form>
          </ActionModal>
        </section>
      ) : null}

      {activeTab === 'affiliates' ? (
        <section className="space-y-6">
          {/* Rates configuration */}
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                  <Percent className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Discount rates</p>
                </div>
                <p className="mt-2 text-sm text-[color:var(--hub-muted)]">
                  When a teacher refers another teacher, both receive a subscription discount. Configure the rates below.
                </p>
              </div>
              {!editingRates ? (
                <button
                  type="button"
                  onClick={() => { setRateReferrer(String(affiliateDiscountReferrer)); setRateReferee(String(affiliateDiscountReferee)); setEditingRates(true); }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold text-[color:var(--hub-muted)]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit rates
                </button>
              ) : null}
            </div>

            {editingRates ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Referrer discount (%)</label>
                  <p className="text-xs text-[color:var(--hub-muted)]">Discount the referring teacher receives on their subscription.</p>
                  <input type="number" min="0" max="100" step="0.5" value={rateReferrer} onChange={(e) => setRateReferrer(e.target.value)} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[color:var(--hub-text)]">Referee discount (%)</label>
                  <p className="text-xs text-[color:var(--hub-muted)]">Discount the new teacher receives on their first month.</p>
                  <input type="number" min="0" max="100" step="0.5" value={rateReferee} onChange={(e) => setRateReferee(e.target.value)} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="button"
                    disabled={isSavingRates}
                    onClick={() => {
                      void (async () => {
                        try {
                          setIsSavingRates(true);
                          await updateAffiliateRates(parseFloat(rateReferrer) || 0, parseFloat(rateReferee) || 0);
                          addNotification({ type: 'success', title: 'Rates saved', message: 'Affiliate discount rates have been updated.', duration: 2200 });
                          setEditingRates(false);
                        } catch (err) {
                          addNotification({ type: 'error', title: 'Save failed', message: err instanceof Error ? err.message : 'Please try again.', duration: 2800 });
                        } finally {
                          setIsSavingRates(false);
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSavingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save rates
                  </button>
                  <button
                    type="button"
                    disabled={isSavingRates}
                    onClick={() => setEditingRates(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[color:var(--hub-border)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Referrer gets</p>
                  <p className="mt-2 text-3xl font-bold text-[color:var(--hub-text)]">{affiliateDiscountReferrer}%</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">off their subscription</p>
                </div>
                <div className="rounded-3xl border border-[color:var(--hub-border)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">New teacher gets</p>
                  <p className="mt-2 text-3xl font-bold text-[color:var(--hub-text)]">{affiliateDiscountReferee}%</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">off their first month</p>
                </div>
              </div>
            )}
          </div>

          {/* Affiliate codes list */}
          <div className="rounded-[30px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <Users2 className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Teacher affiliate codes</p>
            </div>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Each teacher gets a unique affiliate code when they join. Referral counts update when a referred teacher activates a subscription.</p>
            <div className="mt-5 grid gap-3">
              {affiliateCodes.map((aff) => (
                <div key={aff.id} className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--hub-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{aff.teacherName}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--hub-muted)]">{aff.teacherEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold tracking-wider text-[color:var(--hub-primary)]">{aff.code}</span>
                    <button
                      type="button"
                      onClick={() => { void navigator.clipboard?.writeText(aff.code); addNotification({ type: 'success', title: 'Copied', message: `${aff.code} copied to clipboard.`, duration: 1800 }); }}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hub-border)] px-2.5 py-1 text-xs font-medium text-[color:var(--hub-muted)]"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <span className="rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
                      {aff.totalReferrals} referral{aff.totalReferrals !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
              {affiliateCodes.length === 0 ? (
                <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-5 text-sm text-[color:var(--hub-muted)]">No affiliate codes found. Codes are generated when teachers register.</div>
              ) : null}
            </div>
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
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700')}>{alert.severity}</span>
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
