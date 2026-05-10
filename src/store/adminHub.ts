import { create } from 'zustand';
import {
  AdminMetric,
  AuditEvent,
  BroadcastMessage,
  FeatureFlag,
  PlatformUserSummary,
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
  changeUserStatus: (id: string, role: 'TEACHER' | 'STUDENT', status: PlatformUserSummary['status']) => Promise<void>;
  sendBroadcast: (input: { channel: 'email' | 'in_app'; audience: 'all' | 'teachers' | 'students'; subject: string; body: string }) => Promise<void>;
  saveDraftBroadcast: (input: { channel: 'email' | 'in_app'; audience: 'all' | 'teachers' | 'students'; subject: string; body: string }) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  generateReportSnapshot: (name: string) => Promise<void>;
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

  return {
    metrics: [
      { id: 'teachers', label: 'Active teachers', value: '1', note: '2 total' },
      { id: 'students', label: 'Active students', value: '1', note: '2 total' },
      { id: 'lessons', label: 'Lessons delivered', value: '12', note: 'Demo data' },
      { id: 'engagement', label: 'Avg learner progress', value: '74%', note: 'Demo snapshot' },
    ] as AdminMetric[],
    teachers,
    students,
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
        id: 'demo-flag-1',
        name: 'Study assist suggestions',
        description: 'Show AI study prompts in dashboards.',
        enabled: true,
        rollout: 'students',
        updatedAt: now.toISOString(),
      },
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
  isHydrated: false,
  isSyncing: false,
  isLoadingMoreUsers: false,
  usersHasMore: false,
  error: null,

  loadAdminHub: async () => {
    const user = getCurrentAdmin();
    if (!user || user.role !== 'ADMIN') {
      set({
        metrics: [],
        teachers: [],
        students: [],
        teacherInvites: [],
        featureFlags: [],
        reports: [],
        broadcasts: [],
        alerts: [],
        auditEvents: [],
        isHydrated: true,
        isSyncing: false,
        isLoadingMoreUsers: false,
        usersHasMore: false,
        error: null,
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
        metrics: [],
        teachers: [],
        students: [],
        teacherInvites: [],
        featureFlags: [],
        reports: [],
        broadcasts: [],
        alerts: [],
        auditEvents: [],
        isHydrated: true,
        isSyncing: false,
        isLoadingMoreUsers: false,
        usersHasMore: false,
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
      ] = await Promise.all([
        supabase.rpc('admin_metrics'),
        supabase.rpc('admin_list_users', { p_limit: USERS_PAGE_SIZE, p_offset: 0 }),
        supabase.from('admin_feature_flags').select('id, name, description, enabled, rollout, updated_at').order('created_at', { ascending: true }).range(0, 99),
        supabase.from('admin_reports').select('id, name, description, generated_at, kpi').order('generated_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_broadcasts').select('id, channel, audience, subject, body, sent_at, status').order('sent_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_alerts').select('id, title, severity, created_at, status').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('admin_audit_events').select('id, actor_display_name, action, target, created_at').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
        supabase.from('teacher_invites').select('id, email, invite_code, status, expires_at, created_at').order('created_at', { ascending: false }).range(0, FEED_LIMIT - 1),
      ]);

      if (metricsRes.error) throw metricsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (featureFlagsRes.error) throw featureFlagsRes.error;
      if (reportsRes.error) throw reportsRes.error;
      if (broadcastsRes.error) throw broadcastsRes.error;
      if (alertsRes.error) throw alertsRes.error;
      if (auditsRes.error) throw auditsRes.error;
      if (invitesRes.error) throw invitesRes.error;

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
    if (isDemoAdmin(user)) {
      const now = new Date().toISOString();
      set((state) => ({
        teacherInvites: [{
          id: `demo-invite-${Math.random().toString(36).slice(2, 10)}`,
          email: normalizedEmail,
          inviteCode: demoCode(),
          status: 'pending',
          expiresAt: expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: now,
        }, ...state.teacherInvites],
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user?.name || 'Demo Admin',
          action: 'Created teacher invite',
          target: normalizedEmail,
          createdAt: now,
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.rpc('admin_create_teacher_invite', {
      p_email: normalizedEmail,
      p_expires_at: expiresAt || null,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await createAudit('Created teacher invite', normalizedEmail);
    await get().loadAdminHub();
  },

  revokeTeacherInvite: async (inviteId) => {
    const user = getCurrentAdmin();
    if (isDemoAdmin(user)) {
      set((state) => ({
        teacherInvites: state.teacherInvites.map((invite) => (
          invite.id === inviteId ? { ...invite, status: 'revoked' } : invite
        )),
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user?.name || 'Demo Admin',
          action: 'Revoked teacher invite',
          target: inviteId,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.from('teacher_invites').update({ status: 'revoked' }).eq('id', inviteId);
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await createAudit('Revoked teacher invite', inviteId);
    await get().loadAdminHub();
  },

  toggleFeatureFlag: async (id) => {
    const target = get().featureFlags.find((flag) => flag.id === id);
    if (!target) {
      const message = 'Feature flag not found.';
      set({ error: message });
      throw new Error(message);
    }
    const user = getCurrentAdmin();
    if (isDemoAdmin(user)) {
      set((state) => ({
        featureFlags: state.featureFlags.map((flag) => (
          flag.id === id ? { ...flag, enabled: !flag.enabled, updatedAt: new Date().toISOString() } : flag
        )),
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user?.name || 'Demo Admin',
          action: 'Toggled feature',
          target: target.name,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.from('admin_feature_flags').update({ enabled: !target.enabled }).eq('id', id);
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await createAudit('Toggled feature', target.name);
    await get().loadAdminHub();
  },

  changeUserStatus: async (id, _role, status) => {
    const user = getCurrentAdmin();
    if (!user) {
      const message = 'Admin session required.';
      set({ error: message });
      throw new Error(message);
    }
    if (isDemoAdmin(user)) {
      set((state) => ({
        teachers: state.teachers.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
        students: state.students.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user.name || 'Demo Admin',
          action: 'Updated user status',
          target: `${id} (${status})`,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.from('admin_user_statuses').upsert({
      user_id: id,
      status,
      last_active_at: new Date().toISOString(),
      updated_by_user_id: user.id,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    const person = [...get().teachers, ...get().students].find((entry) => entry.id === id);
    await createAudit('Updated user status', `${person?.name || 'User'} (${status})`);
    await get().loadAdminHub();
  },

  sendBroadcast: async ({ channel, audience, subject, body }) => {
    const user = getCurrentAdmin();
    if (isDemoAdmin(user)) {
      set((state) => ({
        broadcasts: [{
          id: `demo-broadcast-${Math.random().toString(36).slice(2, 10)}`,
          channel,
          audience,
          subject,
          body,
          sentAt: new Date().toISOString(),
          status: 'sent',
        }, ...state.broadcasts],
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user?.name || 'Demo Admin',
          action: 'Sent broadcast',
          target: subject,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.rpc('admin_dispatch_broadcast', {
      p_channel: channel,
      p_audience: audience,
      p_subject: subject,
      p_body: body,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await get().loadAdminHub();
  },

  saveDraftBroadcast: async ({ channel, audience, subject, body }) => {
    const user = getCurrentAdmin();
    if (!user) {
      const message = 'Admin session required.';
      set({ error: message });
      throw new Error(message);
    }
    if (isDemoAdmin(user)) {
      set((state) => ({
        broadcasts: [{
          id: `demo-broadcast-${Math.random().toString(36).slice(2, 10)}`,
          channel,
          audience,
          subject,
          body,
          sentAt: new Date().toISOString(),
          status: 'draft',
        }, ...state.broadcasts],
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user.name || 'Demo Admin',
          action: 'Saved broadcast draft',
          target: subject || 'Untitled draft',
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.from('admin_broadcasts').insert({
      channel,
      audience,
      subject,
      body,
      status: 'draft',
      sent_by_user_id: user.id,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await createAudit('Saved broadcast draft', subject || 'Untitled draft');
    await get().loadAdminHub();
  },

  resolveAlert: async (id) => {
    const user = getCurrentAdmin();
    if (isDemoAdmin(user)) {
      set((state) => ({
        alerts: state.alerts.map((alert) => (
          alert.id === id ? { ...alert, status: 'resolved' } : alert
        )),
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user?.name || 'Demo Admin',
          action: 'Resolved alert',
          target: id,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase
      .from('admin_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    const alert = get().alerts.find((entry) => entry.id === id);
    await createAudit('Resolved alert', alert?.title || id);
    await get().loadAdminHub();
  },

  generateReportSnapshot: async (name) => {
    const user = getCurrentAdmin();
    if (!user) {
      const message = 'Admin session required.';
      set({ error: message });
      throw new Error(message);
    }
    if (isDemoAdmin(user)) {
      set((state) => ({
        reports: [{
          id: `demo-report-${Math.random().toString(36).slice(2, 10)}`,
          name,
          description: 'On-demand admin snapshot.',
          generatedAt: new Date().toISOString(),
          kpi: 'Generated just now',
        }, ...state.reports],
        auditEvents: [{
          id: `demo-audit-${Math.random().toString(36).slice(2, 10)}`,
          actor: user.name || 'Demo Admin',
          action: 'Generated report',
          target: name,
          createdAt: new Date().toISOString(),
        }, ...state.auditEvents],
        error: null,
      }));
      return;
    }
    const { error } = await supabase.from('admin_reports').insert({
      name,
      description: 'On-demand admin snapshot.',
      kpi: 'Generated just now',
      generated_by_user_id: user.id,
    });
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    await createAudit('Generated report', name);
    await get().loadAdminHub();
  },
}));
