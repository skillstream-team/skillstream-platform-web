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

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  monthlyFeeGbp: number;
  includedParticipantMinutes: number;
  overagePerParticipantMinuteGbp: number;
  oneOffPlatformFeePercent: number;
  aiMonthlyTokenLimit: number;
  isActive: boolean;
}

export interface AdminTeacherSubscription {
  id: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  planId: string;
  planCode: string;
  planName: string;
  status: string;
  periodEnd: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  appliesTo: 'all' | 'creator' | 'studio' | 'academy';
  createdAt: string;
}

export interface AffiliateCode {
  id: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  code: string;
  discountPercentReferrer: number;
  discountPercentReferee: number;
  totalReferrals: number;
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
