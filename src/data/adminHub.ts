export interface AdminMetric {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface PlatformUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  status: 'active' | 'paused' | 'needs_attention';
  classesCount: number;
  lastActiveAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: 'all' | 'teachers' | 'students';
  updatedAt: string;
}

export interface ReportSnapshot {
  id: string;
  name: string;
  description: string;
  generatedAt: string;
  kpi: string;
}

export interface BroadcastMessage {
  id: string;
  channel: 'email' | 'in_app';
  audience: 'all' | 'teachers' | 'students';
  subject: string;
  body: string;
  sentAt: string;
  status: 'draft' | 'sent';
}

export interface SystemAlert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'open' | 'resolved';
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface TeacherInvite {
  id: string;
  email: string;
  inviteCode: string;
  status: 'pending' | 'claimed' | 'revoked';
  expiresAt: string | null;
  createdAt: string;
}

export const adminMetrics: AdminMetric[] = [];
export const teacherUsers: PlatformUserSummary[] = [];
export const studentUsers: PlatformUserSummary[] = [];
export const featureFlags: FeatureFlag[] = [];
export const reports: ReportSnapshot[] = [];
export const broadcasts: BroadcastMessage[] = [];
export const alerts: SystemAlert[] = [];
export const auditEvents: AuditEvent[] = [];
export const teacherInvites: TeacherInvite[] = [];
