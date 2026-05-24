import { create } from 'zustand';
import {
  AdminMetric,
  AdminTeacherSubscription,
  AffiliateCode,
  AuditEvent,
  BillingPlan,
  BroadcastMessage,
  FeatureFlag,
  PlatformUserSummary,
  PromoCode,
  ReportSnapshot,
  SystemAlert,
  TeacherInvite,
} from '../data/adminHub';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { useAuthStore } from './auth';

interface AdminHubState {
  metrics: AdminMetric[];
  teachers: PlatformUserSummary[];
  students: PlatformUserSummary[];
  teacherInvites: TeacherInvite[];
  featureFlags: FeatureFlag[];
  reports: ReportSnapshot[];
  broadcasts: BroadcastMessage[];
  alerts: SystemAlert[];
  auditEvents: AuditEvent[];
  billingPlans: BillingPlan[];
  teacherSubscriptions: AdminTeacherSubscription[];
  promoCodes: PromoCode[];
  affiliateCodes: AffiliateCode[];
  affiliateDiscountReferrer: number;
  affiliateDiscountReferee: number;
  isHydrated: boolean;
  isSyncing: boolean;
  isLoadingMoreUsers: boolean;
  usersHasMore: boolean;
  error: string | null;
}

interface AdminHubActions {
  loadAdminHub: () => Promise<void>;
  loadMoreUsers: () => Promise<void>;
  createTeacherInvite: (email: string, expiresAt?: string | null) => Promise<void>;
  revokeTeacherInvite: (inviteId: string) => Promise<void>;
  toggleFeatureFlag: (id: string) => Promise<void>;
  updateFeatureFlagRollout: (id: string, rollout: FeatureFlag['rollout']) => Promise<void>;
  changeUserStatus: (id: string, role: 'TEACHER' | 'STUDENT', status: PlatformUserSummary['status']) => Promise<void>;
  sendBroadcast: (input: { channel: 'email' | 'in_app'; audience: 'all' | 'teachers' | 'students'; subject: string; body: string }) => Promise<void>;
  saveDraftBroadcast: (input: { channel: 'email' | 'in_app'; audience: 'all' | 'teachers' | 'students'; subject: string; body: string }) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  generateReportSnapshot: (name: string) => Promise<void>;
  updateBillingPlan: (id: string, updates: Partial<Pick<BillingPlan, 'monthlyFeeGbp' | 'includedParticipantMinutes' | 'overagePerParticipantMinuteGbp' | 'oneOffPlatformFeePercent' | 'aiMonthlyTokenLimit'>>) => Promise<void>;
  cancelTeacherSubscription: (subscriptionId: string) => Promise<void>;
  overrideTeacherPlan: (subscriptionId: string, planId: string) => Promise<void>;
  createPromoCode: (input: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>) => Promise<void>;
  togglePromoCode: (id: string) => Promise<void>;
  deletePromoCode: (id: string) => Promise<void>;
  updateAffiliateRates: (referrerPercent: number, refereePercent: number) => Promise<void>;
}

type AdminHubStore = AdminHubState & AdminHubActions;

type AdminMetricRow = {
  id: string;
  label: string;
  value: string;
  note: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  status: 'active' | 'paused' | 'needs_attention';
  classes_count: number;
  last_active_at: string;
};

type FeatureFlagRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: 'all' | 'teachers' | 'students';
  updated_at: string;
};

type ReportRow = {
  id: string;
  name: string;
  description: string;
  generated_at: string;
  kpi: string;
};

type BroadcastRow = {
  id: string;
  channel: 'email' | 'in_app';
  audience: 'all' | 'teachers' | 'students';
  subject: string;
  body: string;
  sent_at: string;
  status: 'draft' | 'sent';
};

type AlertRow = {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
  status: 'open' | 'resolved';
};

type AuditRow = {
  id: string;
  actor_display_name: string;
  action: string;
  target: string;
  created_at: string;
};

type TeacherInviteRow = {
  id: string;
  email: string;
  invite_code: string;
  status: 'pending' | 'claimed' | 'revoked';
  expires_at: string | null;
  created_at: string;
};

type BillingPlanRow = {
  id: string;
  code: string;
  name: string;
  monthly_fee_gbp: number;
  included_participant_minutes: number;
  overage_per_participant_minute_gbp: number;
  one_off_platform_fee_percent: number;
  ai_monthly_token_limit: number | null;
  is_active: boolean;
};

type SubscriptionRow = {
  id: string;
  teacher_user_id: string;
  status: string;
  period_end: string;
  billing_plans: { id: string; code: string; name: string } | { id: string; code: string; name: string }[] | null;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
};

const getCurrentAdmin = () => useAuthStore.getState().user;
const USERS_PAGE_SIZE = 200;
const isDemoAdmin = (user: ReturnType<typeof getCurrentAdmin>) =>
  Boolean(user?.id === 'demo-admin' || user?.email === 'admin@skillstream.demo');

const demoCode = () => `TCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const buildDemoAdminState = () => {
  const now = new Date();
  const teachers: PlatformUserSummary[] = [
    {
      id: 'demo-teacher',
      name: 'Demo Teacher',
      email: 'teacher@skillstream.demo',
      role: 'TEACHER',
      status: 'active',
      classesCount: 2,
      lastActiveAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-teacher-2',
      name: 'Alicia Brown',
      email: 'alicia.brown@example.com',
      role: 'TEACHER',
      status: 'paused',
      classesCount: 1,
      lastActiveAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ];
  const students: PlatformUserSummary[] = [
    {
      id: 'demo-student',
      name: 'Demo Student',
      email: 'student@skillstream.demo',
      role: 'STUDENT',
      status: 'needs_attention',
      classesCount: 1,
      lastActiveAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-student-2',
      name: 'Nora James',
      email: 'nora.james@example.com',
      role: 'STUDENT',
      status: 'active',
      classesCount: 2,
      lastActiveAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const demoBillingPlans: BillingPlan[] = [
    { id: 'plan-creator', code: 'creator', name: 'Creator', monthlyFeeGbp: 39, includedParticipantMinutes: 10000, overagePerParticipantMinuteGbp: 0.002, oneOffPlatformFeePercent: 8, aiMonthlyTokenLimit: 150000, isActive: true },
    { id: 'plan-studio', code: 'studio', name: 'Studio', monthlyFeeGbp: 89, includedParticipantMinutes: 40000, overagePerParticipantMinuteGbp: 0.002, oneOffPlatformFeePercent: 6, aiMonthlyTokenLimit: 600000, isActive: true },
    { id: 'plan-academy', code: 'academy', name: 'Academy', monthlyFeeGbp: 199, includedParticipantMinutes: 150000, overagePerParticipantMinuteGbp: 0.002, oneOffPlatformFeePercent: 5, aiMonthlyTokenLimit: 2500000, isActive: true },
  ];

  const demoTeacherSubscriptions: AdminTeacherSubscription[] = [
    { id: 'demo-sub-1', teacherUserId: 'demo-teacher', teacherName: 'Demo Teacher', teacherEmail: 'teacher@skillstream.demo', planId: 'plan-studio', planCode: 'studio', planName: 'Studio', status: 'active', periodEnd: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-sub-2', teacherUserId: 'demo-teacher-2', teacherName: 'Alicia Brown', teacherEmail: 'alicia.brown@example.com', planId: 'plan-creator', planCode: 'creator', planName: 'Creator', status: 'active', periodEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const promoCodes: PromoCode[] = [
    { id: 'promo-1', code: 'LAUNCH25', description: 'Launch discount — 25% off first month', discountPercent: 25, maxUses: 100, usedCount: 12, validFrom: new Date(now.getTime() - 7 * 86400000).toISOString(), validUntil: new Date(now.getTime() + 30 * 86400000).toISOString(), isActive: true, appliesTo: 'all', createdAt: new Date(now.getTime() - 7 * 86400000).toISOString() },
    { id: 'promo-2', code: 'STUDIO10', description: '10% off Studio plan', discountPercent: 10, maxUses: null, usedCount: 3, validFrom: new Date(now.getTime() - 14 * 86400000).toISOString(), validUntil: null, isActive: false, appliesTo: 'studio', createdAt: new Date(now.getTime() - 14 * 86400000).toISOString() },
  ];

  const affiliateCodes: AffiliateCode[] = [
    { id: 'aff-1', teacherUserId: 'demo-teacher', teacherName: 'Demo Teacher', teacherEmail: 'teacher@skillstream.demo', code: 'SS-DEMO-TCH', discountPercentReferrer: 10, discountPercentReferee: 15, totalReferrals: 3, createdAt: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { id: 'aff-2', teacherUserId: 'demo-teacher-2', teacherName: 'Alicia Brown', teacherEmail: 'alicia.brown@example.com', code: 'SS-ALI-BRN', discountPercentReferrer: 10, discountPercentReferee: 15, totalReferrals: 1, createdAt: new Date(now.getTime() - 20 * 86400000).toISOString() },
  ];

  return {
    metrics: [
      { id: 'teachers', label: 'Active teachers', value: '1', note: '2 total' },
      { id: 'students', label: 'Active students', value: '1', note: '2 total' },
      { id: 'lessons', label: 'Lessons delivered', value: '12', note: 'Demo data' },
      { id: 'engagement', label: 'Avg learner progress', value: '74%', note: 'Demo snapshot' },
    ] as AdminMetric[],
    teachers,
    students,
    billingPlans: demoBillingPlans,
    teacherSubscriptions: demoTeacherSubscriptions,
    promoCodes,
    affiliateCodes,
    affiliateDiscountReferrer: 10,
    affiliateDiscountReferee: 15,
    teacherInvites: [
      {
        id: 'demo-invite-1',
        email: 'new.teacher@example.com',
        inviteCode: demoCode(),
        status: 'pending',
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
    ] as TeacherInvite[],
    featureFlags: [
      {
        id: 'demo-flag-2',
        name: 'Live office hours',
        description: 'Allow drop-in live sessions for teachers.',
        enabled: true,
        rollout: 'teachers',
        updatedAt: now.toISOString(),
      },
    ] as FeatureFlag[],
    reports: [
      {
        id: 'demo-report-1',
        name: 'Weekly engagement snapshot',
        description: 'Engagement and risk overview',
        generatedAt: now.toISOString(),
        kpi: '74% avg progress',
      },
    ] as ReportSnapshot[],
    broadcasts: [
      {
        id: 'demo-broadcast-1',
        channel: 'in_app',
        audience: 'all',
        subject: 'Welcome to SkillStream',
        body: 'Demo notification for admin testing.',
        sentAt: now.toISOString(),
        status: 'sent',
      },
    ] as BroadcastMessage[],
    alerts: [
      {
        id: 'demo-alert-1',
        title: 'Low engagement in Algebra Focus Group',
        severity: 'medium',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'open',
      },
    ] as SystemAlert[],
    auditEvents: [
      {
        id: 'demo-audit-1',
        actor: 'Demo Admin',
        action: 'Loaded admin workspace',
        target: 'Demo mode',
        createdAt: now.toISOString(),
      },
    ] as AuditEvent[],
  };
};

const toStatusLabel = (value: string): PlatformUserSummary['status'] => {
  if (value === 'paused') return 'paused';
  if (value === 'needs_attention') return 'needs_attention';
  return 'active';
};

const createAudit = async (action: string, target: string) => {
  const user = getCurrentAdmin();
  if (!user) return;
  await supabase.from('admin_audit_events').insert({
    actor_user_id: user.id,
    actor_display_name: user.name || user.email,
    action,
    target,
  });
};

export const useAdminHubStore = create<AdminHubStore>((set, get) => ({
  metrics: [],
  teachers: [],
  students: [],
  teacherInvites: [],
  featureFlags: [],
  reports: [],
  broadcasts: [],
  alerts: [],
  auditEvents: [],
  billingPlans: [],
  teacherSubscriptions: [],
  promoCodes: [],
  affiliateCodes: [],
  affiliateDiscountReferrer: 10,
  affiliateDiscountReferee: 15,
  isHydrated: false,
  isSyncing: false,
  isLoadingMoreUsers: false,
  usersHasMore: false,
  error: null,

  loadAdminHub: async () => {
    const user = getCurrentAdmin();
    if (!user || user.role !== 'ADMIN') {
      set({
        metrics: [], teachers: [], students: [], teacherInvites: [], featureFlags: [],
        reports: [], broadcasts: [], alerts: [], auditEvents: [], billingPlans: [],
        teacherSubscriptions: [], promoCodes: [], affiliateCodes: [],
        affiliateDiscountReferrer: 10, affiliateDiscountReferee: 15,
        isHydrated: true, isSyncing: false, isLoadingMoreUsers: false, usersHasMore: false, error: null,
      });
      return;
    }
    if (isDemoAdmin(user)) {
      const demo = buildDemoAdminState();
      set({
        ...demo,
        isHydrated: true,
        isSyncing: false,
        isLoadingMoreUsers: false,
        usersHasMore: false,
        error: null,
      });
      return;
    }
    if (!hasSupabaseConfig) {
      set({
        metrics: [], teachers: [], students: [], teacherInvites: [], featureFlags: [],
        reports: [], broadcasts: [], alerts: [], auditEvents: [], billingPlans: [],
        teacherSubscriptions: [], promoCodes: [], affiliateCodes: [],
        affiliateDiscountReferrer: 10, affiliateDiscountReferee: 15,
        isHydrated: true, isSyncing: false, isLoadingMoreUsers: false, usersHasMore: false,
        error: 'Supabase is not configured.',
      });
      return;
    }

    set({ isSyncing: true, error: null });
    try {
      const FEED_LIMIT = 200;
      const [
        metricsRes,
        usersRes,
        featureFlagsRes,
        reportsRes,
        broadcastsRes,
        alertsRes,
        auditsRes,
        invitesRes,
        billingPlansRes,
        subscriptionsRes,
        promoCodesRes,
        affiliateCodesRes,
      ] = await Promise.all([
        supabase.rpc('admin_metrics'),
        supabase.rpc('admin_list_users', { p_limit: USERS_PAGE_SIZE, p_offset: 0 }),
        supabase.from('admin_feature_flags').select('id, name, description, enabled, rollout, updated_at').order('created_at', { ascending: true }).range(0, 99),
        supabase.from('admin_reports').select('id, name, description, generated_at, kpi').order('generated_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_broadcasts').select('id, channel, audience, subject, body, sent_at, status').order('sent_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_alerts').select('id, title, severity, created_at, status').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_audit_events').select('id, actor_display_name, action, target, created_at').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('teacher_invites').select('id, email, invite_code, status, expires_at, created_at').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('billing_plans').select('id, code, name, monthly_fee_gbp, included_participant_minutes, overage_per_participant_minute_gbp, one_off_platform_fee_percent, ai_monthly_token_limit, is_active').order('monthly_fee_gbp', { ascending: true }),
        supabase.from('teacher_subscriptions').select('id, teacher_user_id, status, period_end, billing_plans(id, code, name), profiles(full_name, email)').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('promo_codes').select('id, code, description, discount_percent, max_uses, used_count, valid_from, valid_until, is_active, applies_to, created_at').order('created_at', { ascending: false }),
        supabase.from('affiliate_codes').select('id, teacher_user_id, code, discount_percent_referrer, discount_percent_referee, total_referrals, created_at, profiles(full_name, email)').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
      ]);

      if (metricsRes.error) throw metricsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (featureFlagsRes.error) throw featureFlagsRes.error;
      if (reportsRes.error) throw reportsRes.error;
      if (broadcastsRes.error) throw broadcastsRes.error;
      if (alertsRes.error) throw alertsRes.error;
      if (auditsRes.error) throw auditsRes.error;
      if (invitesRes.error) throw invitesRes.error;
      // billing errors are non-fatal — log and continue

      const people: PlatformUserSummary[] = ((usersRes.data || []) as UserRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: toStatusLabel(row.status),
        classesCount: row.classes_count || 0,
        lastActiveAt: row.last_active_at || new Date().toISOString(),
      }));

      const teachers = people.filter((entry) => entry.role === 'TEACHER');
      const students = people.filter((entry) => entry.role === 'STUDENT');
      const metrics: AdminMetric[] = ((metricsRes.data || []) as AdminMetricRow[]).map((row) => ({
        id: row.id,
        label: row.label,
        value: row.value,
        note: row.note,
      }));

      set(() => ({
        metrics,
        teachers,
        students,
        teacherInvites: ((invitesRes.data || []) as TeacherInviteRow[]).map((row) => ({
          id: row.id,
          email: row.email,
          inviteCode: row.invite_code,
          status: row.status,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
        })),
        featureFlags: ((featureFlagsRes.data || []) as FeatureFlagRow[]).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          enabled: row.enabled,
          rollout: row.rollout,
          updatedAt: row.updated_at,
        })),
        reports: ((reportsRes.data || []) as ReportRow[]).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          generatedAt: row.generated_at,
          kpi: row.kpi,
        })),
        broadcasts: ((broadcastsRes.data || []) as BroadcastRow[]).map((row) => ({
          id: row.id,
          channel: row.channel,
          audience: row.audience,
          subject: row.subject,
          body: row.body,
          sentAt: row.sent_at,
          status: row.status,
        })),
        alerts: ((alertsRes.data || []) as AlertRow[]).map((row) => ({
          id: row.id,
          title: row.title,
          severity: row.severity,
          createdAt: row.created_at,
          status: row.status,
        })),
        auditEvents: ((auditsRes.data || []) as AuditRow[]).map((row) => ({
          id: row.id,
          actor: row.actor_display_name,
          action: row.action,
          target: row.target,
          createdAt: row.created_at,
        })),
        billingPlans: ((billingPlansRes.data || []) as BillingPlanRow[]).map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          monthlyFeeGbp: Number(row.monthly_fee_gbp),
          includedParticipantMinutes: row.included_participant_minutes,
          overagePerParticipantMinuteGbp: Number(row.overage_per_participant_minute_gbp),
          oneOffPlatformFeePercent: Number(row.one_off_platform_fee_percent),
          aiMonthlyTokenLimit: row.ai_monthly_token_limit ?? 0,
          isActive: row.is_active,
        })),
        teacherSubscriptions: ((subscriptionsRes.data || []) as SubscriptionRow[]).map((row) => {
          const plan = Array.isArray(row.billing_plans) ? row.billing_plans[0] : row.billing_plans;
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            id: row.id,
            teacherUserId: row.teacher_user_id,
            teacherName: profile?.full_name || 'Unknown teacher',
            teacherEmail: profile?.email || '',
            planId: plan?.id || '',
            planCode: plan?.code || '',
            planName: plan?.name || '',
            status: row.status,
            periodEnd: row.period_end,
          };
        }),
        promoCodes: ((promoCodesRes.data || []) as Array<{
          id: string; code: string; description: string | null; discount_percent: number;
          max_uses: number | null; used_count: number; valid_from: string; valid_until: string | null;
          is_active: boolean; applies_to: string; created_at: string;
        }>).map((row) => ({
          id: row.id, code: row.code, description: row.description || '',
          discountPercent: Number(row.discount_percent), maxUses: row.max_uses,
          usedCount: row.used_count, validFrom: row.valid_from, validUntil: row.valid_until,
          isActive: row.is_active, appliesTo: row.applies_to as PromoCode['appliesTo'], createdAt: row.created_at,
        })),
        affiliateCodes: ((affiliateCodesRes.data || []) as Array<{
          id: string; teacher_user_id: string; code: string; discount_percent_referrer: number;
          discount_percent_referee: number; total_referrals: number; created_at: string;
          profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
        }>).map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            id: row.id, teacherUserId: row.teacher_user_id,
            teacherName: profile?.full_name || 'Unknown', teacherEmail: profile?.email || '',
            code: row.code, discountPercentReferrer: Number(row.discount_percent_referrer),
            discountPercentReferee: Number(row.discount_percent_referee),
            totalReferrals: row.total_referrals, createdAt: row.created_at,
          };
        }),
        affiliateDiscountReferrer: 10,
        affiliateDiscountReferee: 15,
        isHydrated: true,
        isSyncing: false,
        isLoadingMoreUsers: false,
        usersHasMore: people.length === USERS_PAGE_SIZE,
        error: null,
      }));
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Could not load admin data.';
      set({
        isHydrated: true,
        isSyncing: false,
        isLoadingMoreUsers: false,
        usersHasMore: false,
        error: message,
      });
    }
  },

  loadMoreUsers: async () => {
    const user = getCurrentAdmin();
    if (isDemoAdmin(user)) {
      set({ isLoadingMoreUsers: false, usersHasMore: false, error: null });
      return;
    }
    if (!user || user.role !== 'ADMIN' || !hasSupabaseConfig) return;
    if (get().isLoadingMoreUsers || !get().usersHasMore) return;

    set({ isLoadingMoreUsers: true, error: null });
    try {
      const currentPeople = [...get().teachers, ...get().students];
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_limit: USERS_PAGE_SIZE,
        p_offset: currentPeople.length,
      });
      if (error) throw error;

      const nextPeople: PlatformUserSummary[] = ((data || []) as UserRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: toStatusLabel(row.status),
        classesCount: row.classes_count || 0,
        lastActiveAt: row.last_active_at || new Date().toISOString(),
      }));

      const deduped = new Map<string, PlatformUserSummary>();
      [...currentPeople, ...nextPeople].forEach((entry) => {
        deduped.set(entry.id, entry);
      });
      const mergedPeople = Array.from(deduped.values());
      const teachers = mergedPeople.filter((entry) => entry.role === 'TEACHER');
      const students = mergedPeople.filter((entry) => entry.role === 'STUDENT');

      set({
        teachers,
        students,
        isLoadingMoreUsers: false,
        usersHasMore: nextPeople.length === USERS_PAGE_SIZE,
        error: null,
      });
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Could not load more users.';
      set({ isLoadingMoreUsers: false, error: message });
    }
  },

  createTeacherInvite: async (email, expiresAt) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      const message = 'Invite email is required.';
      set({ error: message });
      throw new Error(message);
    }
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    const optimisticInvite: TeacherInvite = {
      id: `inv-${Math.random().toString(36).slice(2, 10)}`,
      email: normalizedEmail,
      inviteCode: demoCode(),
      status: 'pending',
      expiresAt: expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    };
    const optimisticAudit: AuditEvent = {
      id: `aud-${Math.random().toString(36).slice(2, 10)}`,
      actor: user?.name || 'Admin',
      action: 'Created teacher invite',
      target: normalizedEmail,
      createdAt: now,
    };
    set((state) => ({
      teacherInvites: [optimisticInvite, ...state.teacherInvites],
      auditEvents: [optimisticAudit, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.rpc('admin_create_teacher_invite', {
      p_email: normalizedEmail,
      p_expires_at: expiresAt || null,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    void createAudit('Created teacher invite', normalizedEmail);
    void get().loadAdminHub();
  },

  revokeTeacherInvite: async (inviteId) => {
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    set((state) => ({
      teacherInvites: state.teacherInvites.map((invite) => invite.id === inviteId ? { ...invite, status: 'revoked' } : invite),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Revoked teacher invite', target: inviteId, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('teacher_invites').update({ status: 'revoked' }).eq('id', inviteId);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Revoked teacher invite', inviteId);
  },

  toggleFeatureFlag: async (id) => {
    const target = get().featureFlags.find((flag) => flag.id === id);
    if (!target) { const message = 'Feature flag not found.'; set({ error: message }); throw new Error(message); }
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    const next = !target.enabled;
    set((state) => ({
      featureFlags: state.featureFlags.map((flag) => flag.id === id ? { ...flag, enabled: next, updatedAt: now } : flag),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: `${next ? 'Enabled' : 'Disabled'} feature`, target: target.name, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_feature_flags').update({ enabled: next, updated_at: now }).eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit(`${next ? 'Enabled' : 'Disabled'} feature`, target.name);
  },

  updateFeatureFlagRollout: async (id, rollout) => {
    const target = get().featureFlags.find((flag) => flag.id === id);
    if (!target) return;
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    set((state) => ({
      featureFlags: state.featureFlags.map((flag) => flag.id === id ? { ...flag, rollout, updatedAt: now } : flag),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Updated feature rollout', target: `${target.name} → ${rollout}`, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_feature_flags').update({ rollout, updated_at: now }).eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Updated feature rollout', `${target.name} → ${rollout}`);
  },

  changeUserStatus: async (id, _role, status) => {
    const user = getCurrentAdmin();
    if (!user) { const message = 'Admin session required.'; set({ error: message }); throw new Error(message); }
    const person = [...get().teachers, ...get().students].find((entry) => entry.id === id);
    const now = new Date().toISOString();
    set((state) => ({
      teachers: state.teachers.map((entry) => entry.id === id ? { ...entry, status } : entry),
      students: state.students.map((entry) => entry.id === id ? { ...entry, status } : entry),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user.name || 'Admin', action: 'Updated user status', target: `${person?.name || id} → ${status}`, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_user_statuses').upsert({ user_id: id, status, last_active_at: now, updated_by_user_id: user.id });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Updated user status', `${person?.name || 'User'} (${status})`);
  },

  sendBroadcast: async ({ channel, audience, subject, body }) => {
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    set((state) => ({
      broadcasts: [{ id: `bc-${Math.random().toString(36).slice(2, 10)}`, channel, audience, subject, body, sentAt: now, status: 'sent' }, ...state.broadcasts],
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Sent broadcast', target: subject, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.rpc('admin_dispatch_broadcast', { p_channel: channel, p_audience: audience, p_subject: subject, p_body: body });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
  },

  saveDraftBroadcast: async ({ channel, audience, subject, body }) => {
    const user = getCurrentAdmin();
    if (!user) { const message = 'Admin session required.'; set({ error: message }); throw new Error(message); }
    const now = new Date().toISOString();
    set((state) => ({
      broadcasts: [{ id: `bc-${Math.random().toString(36).slice(2, 10)}`, channel, audience, subject, body, sentAt: now, status: 'draft' }, ...state.broadcasts],
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user.name || 'Admin', action: 'Saved broadcast draft', target: subject || 'Untitled draft', createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_broadcasts').insert({ channel, audience, subject, body, status: 'draft', sent_by_user_id: user.id });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Saved broadcast draft', subject || 'Untitled draft');
  },

  resolveAlert: async (id) => {
    const user = getCurrentAdmin();
    const alert = get().alerts.find((a) => a.id === id);
    const now = new Date().toISOString();
    set((state) => ({
      alerts: state.alerts.map((a) => a.id === id ? { ...a, status: 'resolved' } : a),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Resolved alert', target: alert?.title || id, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_alerts').update({ status: 'resolved', resolved_at: now }).eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Resolved alert', alert?.title || id);
  },

  generateReportSnapshot: async (name) => {
    const user = getCurrentAdmin();
    if (!user) { const message = 'Admin session required.'; set({ error: message }); throw new Error(message); }
    const now = new Date().toISOString();
    set((state) => ({
      reports: [{ id: `rep-${Math.random().toString(36).slice(2, 10)}`, name, description: 'On-demand admin snapshot.', generatedAt: now, kpi: 'Generated just now' }, ...state.reports],
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user.name || 'Admin', action: 'Generated report', target: name, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('admin_reports').insert({ name, description: 'On-demand admin snapshot.', kpi: 'Generated just now', generated_by_user_id: user.id });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Generated report', name);
  },

  updateBillingPlan: async (id, updates) => {
    const user = getCurrentAdmin();
    const plan = get().billingPlans.find((p) => p.id === id);
    const now = new Date().toISOString();
    set((state) => ({
      billingPlans: state.billingPlans.map((p) => p.id === id ? { ...p, ...updates } : p),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Updated billing plan', target: plan?.name || id, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.monthlyFeeGbp !== undefined) dbUpdates.monthly_fee_gbp = updates.monthlyFeeGbp;
    if (updates.includedParticipantMinutes !== undefined) dbUpdates.included_participant_minutes = updates.includedParticipantMinutes;
    if (updates.overagePerParticipantMinuteGbp !== undefined) dbUpdates.overage_per_participant_minute_gbp = updates.overagePerParticipantMinuteGbp;
    if (updates.oneOffPlatformFeePercent !== undefined) dbUpdates.one_off_platform_fee_percent = updates.oneOffPlatformFeePercent;
    if (updates.aiMonthlyTokenLimit !== undefined) dbUpdates.ai_monthly_token_limit = updates.aiMonthlyTokenLimit;
    const { error } = await supabase.from('billing_plans').update(dbUpdates).eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Updated billing plan', plan?.name || id);
  },

  cancelTeacherSubscription: async (subscriptionId) => {
    const user = getCurrentAdmin();
    const sub = get().teacherSubscriptions.find((s) => s.id === subscriptionId);
    const now = new Date().toISOString();
    set((state) => ({
      teacherSubscriptions: state.teacherSubscriptions.map((s) => s.id === subscriptionId ? { ...s, status: 'cancelled' } : s),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Cancelled teacher subscription', target: sub?.teacherName || subscriptionId, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('teacher_subscriptions').update({ status: 'cancelled' }).eq('id', subscriptionId);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Cancelled teacher subscription', sub?.teacherName || subscriptionId);
  },

  createPromoCode: async (input) => {
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    const optimistic: PromoCode = { id: `promo-${Math.random().toString(36).slice(2, 10)}`, ...input, usedCount: 0, createdAt: now };
    set((state) => ({
      promoCodes: [optimistic, ...state.promoCodes],
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Created promo code', target: input.code, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('promo_codes').insert({
      code: input.code, description: input.description || null, discount_percent: input.discountPercent,
      max_uses: input.maxUses ?? null, valid_from: input.validFrom, valid_until: input.validUntil ?? null,
      is_active: input.isActive, applies_to: input.appliesTo, created_by_user_id: user?.id,
    });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Created promo code', input.code);
  },

  togglePromoCode: async (id) => {
    const user = getCurrentAdmin();
    const promo = get().promoCodes.find((p) => p.id === id);
    if (!promo) return;
    const now = new Date().toISOString();
    const next = !promo.isActive;
    set((state) => ({
      promoCodes: state.promoCodes.map((p) => p.id === id ? { ...p, isActive: next } : p),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: `${next ? 'Activated' : 'Deactivated'} promo code`, target: promo.code, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('promo_codes').update({ is_active: next }).eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit(`${next ? 'Activated' : 'Deactivated'} promo code`, promo.code);
  },

  deletePromoCode: async (id) => {
    const user = getCurrentAdmin();
    const promo = get().promoCodes.find((p) => p.id === id);
    const now = new Date().toISOString();
    set((state) => ({
      promoCodes: state.promoCodes.filter((p) => p.id !== id),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Deleted promo code', target: promo?.code || id, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Deleted promo code', promo?.code || id);
  },

  updateAffiliateRates: async (referrerPercent, refereePercent) => {
    const user = getCurrentAdmin();
    const now = new Date().toISOString();
    set((state) => ({
      affiliateDiscountReferrer: referrerPercent,
      affiliateDiscountReferee: refereePercent,
      affiliateCodes: state.affiliateCodes.map((a) => ({ ...a, discountPercentReferrer: referrerPercent, discountPercentReferee: refereePercent })),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Updated affiliate rates', target: `Referrer: ${referrerPercent}% / Referee: ${refereePercent}%`, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('affiliate_codes').update({ discount_percent_referrer: referrerPercent, discount_percent_referee: refereePercent });
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Updated affiliate rates', `Referrer: ${referrerPercent}% / Referee: ${refereePercent}%`);
  },

  overrideTeacherPlan: async (subscriptionId, planId) => {
    const user = getCurrentAdmin();
    const plan = get().billingPlans.find((p) => p.id === planId);
    const sub = get().teacherSubscriptions.find((s) => s.id === subscriptionId);
    const now = new Date().toISOString();
    set((state) => ({
      teacherSubscriptions: state.teacherSubscriptions.map((s) =>
        s.id === subscriptionId ? { ...s, planId, planCode: plan?.code || '', planName: plan?.name || '', status: 'active' } : s
      ),
      auditEvents: [{ id: `aud-${Math.random().toString(36).slice(2, 10)}`, actor: user?.name || 'Admin', action: 'Overrode teacher plan', target: `${sub?.teacherName || subscriptionId} → ${plan?.name || planId}`, createdAt: now }, ...state.auditEvents],
      error: null,
    }));
    if (isDemoAdmin(user)) return;
    const { error } = await supabase.from('teacher_subscriptions').update({ billing_plan_id: planId, status: 'active' }).eq('id', subscriptionId);
    if (error) { set({ error: error.message }); throw new Error(error.message); }
    void createAudit('Overrode teacher plan', `${sub?.teacherName || subscriptionId} → ${plan?.name || planId}`);
  },
}));
