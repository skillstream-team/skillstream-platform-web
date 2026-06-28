import { create } from 'zustand';
import {
  AuditAction, Course, CourseCategory, CourseDifficulty, CourseLesson, CourseModule, CourseRating,
  Enrollment, LearningPath, OrgAnnouncement, OrgAuditEvent, OrgMember, OrgTeam, Organization, PathCourse, QuizStat,
} from '../data/orgHub';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

// ─── Supabase row types ────────────────────────────────────────────────────

type OrgRow = {
  id: string; name: string; slug: string; logo_url: string | null; seat_limit: number; created_at: string;
  sso_provider: string | null; sso_idp_url: string | null; sso_entity_id: string | null; sso_certificate: string | null;
  reminders_enabled: boolean; reminder_days_before: number;
  report_schedule_enabled: boolean; report_schedule_frequency: 'weekly' | 'monthly'; report_schedule_email: string;
};
type OrgMemberRow = { user_id: string; org_role: string; joined_at: string; job_title: string | null; department: string | null; manager_user_id: string | null; profiles: { full_name: string; email: string } };
type RatingRow = { id: string; course_id: string; enrollment_id: string; user_id: string; rating: number; comment: string | null; created_at: string; profiles: { full_name: string } };
type CourseRow = {
  id: string; org_id: string | null; created_by_user_id: string; title: string;
  description: string | null; thumbnail_url: string | null; is_published: boolean;
  estimated_minutes: number | null; category: string | null; difficulty: string | null;
  skills: string[] | null; created_at: string; updated_at: string;
};
type ModuleRow = { id: string; course_id: string; title: string; position: number; created_at: string };
type LessonRow = {
  id: string; module_id: string; title: string; kind: string; position: number;
  content_body: string | null; video_url: string | null; duration_minutes: number | null;
  quiz_questions: unknown; quiz_pass_score: number; created_at: string;
};
type EnrollmentRow = {
  id: string; course_id: string; user_id: string; org_id: string; is_mandatory: boolean;
  enrolled_at: string; deadline_at: string | null; completed_at: string | null;
  profiles: { full_name: string; email: string };
  courses: { title: string };
  lesson_completions: { lesson_id: string }[];
};
type TeamRow = { id: string; org_id: string; name: string; created_at: string };
type TeamMemberRow = { team_id: string; user_id: string };
type PathRow = { id: string; org_id: string; title: string; description: string | null; is_published: boolean; created_at: string; updated_at: string };
type PathCourseRow = { id: string; path_id: string; course_id: string; position: number };
type AnnouncementRow = { id: string; org_id: string; title: string; body: string; is_active: boolean; created_at: string; expires_at: string | null };

// ─── Demo data ─────────────────────────────────────────────────────────────

const DEMO_ORG: Organization = {
  id: 'demo-org', name: 'Acme Corp', slug: 'acme-corp', seatLimit: 50,
  createdAt: '2026-01-01T09:00:00.000Z',
  remindersEnabled: true, reminderDaysBefore: 7,
  reportScheduleEnabled: true, reportScheduleFrequency: 'weekly', reportScheduleEmail: 'orgadmin@skillstream.demo',
};

const DEMO_MEMBERS: OrgMember[] = [
  { userId: 'demo-orgadmin', name: 'Demo Admin', email: 'orgadmin@skillstream.demo', orgRole: 'admin', joinedAt: '2026-01-01T09:00:00.000Z', teamIds: [], jobTitle: 'L&D Manager', department: 'HR' },
  { userId: 'demo-learner', name: 'Demo Learner', email: 'learner@skillstream.demo', orgRole: 'learner', joinedAt: '2026-01-15T09:00:00.000Z', teamIds: ['demo-team-1'], jobTitle: 'Software Engineer', department: 'Engineering' },
  { userId: 'demo-learner-2', name: 'Alex Johnson', email: 'alex@acme.example', orgRole: 'manager', joinedAt: '2026-02-01T09:00:00.000Z', teamIds: ['demo-team-1'], jobTitle: 'Engineering Manager', department: 'Engineering', managedUserIds: ['demo-learner', 'demo-learner-5'] },
  { userId: 'demo-learner-3', name: 'Priya Sharma', email: 'priya@acme.example', orgRole: 'learner', joinedAt: '2026-02-10T09:00:00.000Z', teamIds: ['demo-team-2'], jobTitle: 'Operations Lead', department: 'Operations' },
  { userId: 'demo-learner-4', name: 'Marcus Webb', email: 'marcus@acme.example', orgRole: 'learner', joinedAt: '2026-03-01T09:00:00.000Z', teamIds: ['demo-team-2'], jobTitle: 'Business Analyst', department: 'Operations' },
  { userId: 'demo-learner-5', name: 'Sara Kim', email: 'sara@acme.example', orgRole: 'learner', joinedAt: '2026-03-15T09:00:00.000Z', teamIds: ['demo-team-1'], jobTitle: 'Frontend Developer', department: 'Engineering' },
];

const DEMO_TEAMS: OrgTeam[] = [
  { id: 'demo-team-1', orgId: 'demo-org', name: 'Engineering', memberIds: ['demo-learner', 'demo-learner-2'], createdAt: '2026-01-10T09:00:00.000Z' },
  { id: 'demo-team-2', orgId: 'demo-org', name: 'Operations', memberIds: ['demo-learner-3', 'demo-learner-4'], createdAt: '2026-01-10T09:00:00.000Z' },
];

const DEMO_COURSES: Course[] = [
  {
    id: 'demo-course-1', orgId: 'demo-org', createdByUserId: 'demo-orgadmin',
    title: 'Workplace Safety Fundamentals', description: 'Core health and safety procedures every employee must complete.',
    isPublished: true, estimatedMinutes: 90, category: 'health-safety', difficulty: 'beginner',
    skills: ['Health & Safety', 'Risk Management', 'Emergency Procedures'],
    createdAt: '2026-02-01T09:00:00.000Z', updatedAt: '2026-02-01T09:00:00.000Z',
    modules: [
      {
        id: 'demo-mod-1', courseId: 'demo-course-1', title: 'Introduction', position: 1,
        lessons: [
          { id: 'demo-lesson-1', moduleId: 'demo-mod-1', title: 'Welcome & Course Overview', kind: 'video', position: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', durationMinutes: 5, quizPassScore: 80 },
          { id: 'demo-lesson-2', moduleId: 'demo-mod-1', title: 'Why Safety Matters', kind: 'text', position: 2, contentBody: 'Workplace safety is the responsibility of every employee. This module covers the core principles you need to know to stay safe and keep your colleagues safe.', quizPassScore: 80 },
        ],
      },
      {
        id: 'demo-mod-2', courseId: 'demo-course-1', title: 'Emergency Procedures', position: 2,
        lessons: [
          { id: 'demo-lesson-3', moduleId: 'demo-mod-2', title: 'Fire Safety', kind: 'text', position: 1, contentBody: 'In the event of a fire, activate the nearest alarm, evacuate via the nearest exit, and assemble at the designated muster point.', quizPassScore: 80 },
          { id: 'demo-lesson-4', moduleId: 'demo-mod-2', title: 'Safety Knowledge Check', kind: 'quiz', position: 2, quizPassScore: 80, quizQuestions: [
            { question: 'What is the first thing to do in a fire emergency?', options: ['Call your manager', 'Activate the nearest alarm', 'Pack your belongings', 'Use the elevator'], correctIndex: 1, explanation: 'Always activate the alarm first to alert everyone in the building.' },
            { question: 'Where should you assemble after evacuating?', options: ['Nearest car park', 'Designated muster point', 'Reception area', 'Nearest coffee shop'], correctIndex: 1 },
          ]},
        ],
      },
    ],
  },
  {
    id: 'demo-course-2', orgId: 'demo-org', createdByUserId: 'demo-orgadmin',
    title: 'Data Privacy & GDPR Essentials', description: 'A practical guide to data protection law for business professionals.',
    isPublished: true, estimatedMinutes: 60, category: 'compliance', difficulty: 'intermediate',
    skills: ['GDPR', 'Data Privacy', 'Compliance', 'Data Protection'],
    createdAt: '2026-01-15T09:00:00.000Z', updatedAt: '2026-01-15T09:00:00.000Z',
    modules: [
      {
        id: 'demo-mod-3', courseId: 'demo-course-2', title: 'GDPR Fundamentals', position: 1,
        lessons: [
          { id: 'demo-lesson-5', moduleId: 'demo-mod-3', title: 'What is GDPR?', kind: 'text', position: 1, contentBody: 'The General Data Protection Regulation (GDPR) is a legal framework that sets guidelines for the collection and processing of personal information from individuals within the EU.', quizPassScore: 80 },
          { id: 'demo-lesson-6', moduleId: 'demo-mod-3', title: 'Key Principles', kind: 'video', position: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', durationMinutes: 8, quizPassScore: 80 },
        ],
      },
    ],
  },
  {
    id: 'demo-course-3', orgId: 'demo-org', createdByUserId: 'demo-orgadmin',
    title: 'Leadership Essentials for New Managers', description: 'Build the skills to lead high-performing teams. Covers delegation, feedback, and difficult conversations.',
    isPublished: true, estimatedMinutes: 120, category: 'leadership', difficulty: 'intermediate',
    skills: ['Leadership', 'Management', 'Communication', 'Delegation'],
    createdAt: '2026-03-01T09:00:00.000Z', updatedAt: '2026-03-01T09:00:00.000Z',
    modules: [
      {
        id: 'demo-mod-4', courseId: 'demo-course-3', title: 'Foundations of Leadership', position: 1,
        lessons: [
          { id: 'demo-lesson-7', moduleId: 'demo-mod-4', title: 'What Makes a Great Leader?', kind: 'video', position: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', durationMinutes: 10, quizPassScore: 80 },
          { id: 'demo-lesson-8', moduleId: 'demo-mod-4', title: 'Leadership Styles', kind: 'text', position: 2, contentBody: 'There is no single best leadership style. Effective leaders adapt their approach to their team and situation.', quizPassScore: 80 },
          { id: 'demo-lesson-9', moduleId: 'demo-mod-4', title: 'Leadership Quiz', kind: 'quiz', position: 3, quizPassScore: 80, quizQuestions: [
            { question: 'Which leadership style is best for a new, inexperienced team?', options: ['Laissez-faire', 'Coaching', 'Delegating', 'Transactional'], correctIndex: 1, explanation: 'Coaching provides direction and support that new teams need.' },
          ]},
        ],
      },
    ],
  },
];

const DEMO_ENROLLMENTS: Enrollment[] = [
  { id: 'demo-enroll-1', courseId: 'demo-course-1', courseTitle: 'Workplace Safety Fundamentals', userId: 'demo-learner', userName: 'Demo Learner', userEmail: 'learner@skillstream.demo', orgId: 'demo-org', enrolledAt: '2026-03-01T09:00:00.000Z', deadlineAt: '2026-06-01T09:00:00.000Z', completionPercent: 50, hasCertificate: false, isMandatory: true },
  { id: 'demo-enroll-2', courseId: 'demo-course-2', courseTitle: 'Data Privacy & GDPR Essentials', userId: 'demo-learner', userName: 'Demo Learner', userEmail: 'learner@skillstream.demo', orgId: 'demo-org', enrolledAt: '2026-03-01T09:00:00.000Z', completedAt: '2026-04-01T09:00:00.000Z', completionPercent: 100, hasCertificate: true, isMandatory: true },
  { id: 'demo-enroll-3', courseId: 'demo-course-1', courseTitle: 'Workplace Safety Fundamentals', userId: 'demo-learner-2', userName: 'Alex Johnson', userEmail: 'alex@acme.example', orgId: 'demo-org', enrolledAt: '2026-03-15T09:00:00.000Z', deadlineAt: '2026-06-01T09:00:00.000Z', completionPercent: 100, hasCertificate: true, completedAt: '2026-04-20T09:00:00.000Z', isMandatory: true },
  { id: 'demo-enroll-4', courseId: 'demo-course-1', courseTitle: 'Workplace Safety Fundamentals', userId: 'demo-learner-3', userName: 'Priya Sharma', userEmail: 'priya@acme.example', orgId: 'demo-org', enrolledAt: '2026-04-01T09:00:00.000Z', deadlineAt: '2026-05-01T09:00:00.000Z', completionPercent: 25, hasCertificate: false, isMandatory: true },
  { id: 'demo-enroll-5', courseId: 'demo-course-2', courseTitle: 'Data Privacy & GDPR Essentials', userId: 'demo-learner-2', userName: 'Alex Johnson', userEmail: 'alex@acme.example', orgId: 'demo-org', enrolledAt: '2026-04-01T09:00:00.000Z', completionPercent: 75, hasCertificate: false, isMandatory: false },
  { id: 'demo-enroll-6', courseId: 'demo-course-3', courseTitle: 'Leadership Essentials for New Managers', userId: 'demo-learner-2', userName: 'Alex Johnson', userEmail: 'alex@acme.example', orgId: 'demo-org', enrolledAt: '2026-04-10T09:00:00.000Z', completionPercent: 0, hasCertificate: false, isMandatory: false },
];

const DEMO_PATHS: LearningPath[] = [
  {
    id: 'demo-path-1', orgId: 'demo-org', title: 'New Employee Onboarding', isPublished: true,
    description: 'Everything a new hire needs to complete in their first 30 days.',
    createdAt: '2026-02-15T09:00:00.000Z', updatedAt: '2026-02-15T09:00:00.000Z',
    courses: [
      { id: 'demo-pc-1', pathId: 'demo-path-1', courseId: 'demo-course-1', courseTitle: 'Workplace Safety Fundamentals', position: 1, estimatedMinutes: 90, totalLessons: 4 },
      { id: 'demo-pc-2', pathId: 'demo-path-1', courseId: 'demo-course-2', courseTitle: 'Data Privacy & GDPR Essentials', position: 2, estimatedMinutes: 60, totalLessons: 2 },
    ],
  },
];

const DEMO_RATINGS: CourseRating[] = [
  { id: 'demo-rating-1', courseId: 'demo-course-2', enrollmentId: 'demo-enroll-2', userId: 'demo-learner', rating: 5, comment: 'Excellent course — clear explanations and very relevant to my work.', learnerName: 'Demo Learner', createdAt: '2026-04-02T09:00:00.000Z' },
  { id: 'demo-rating-2', courseId: 'demo-course-1', enrollmentId: 'demo-enroll-3', userId: 'demo-learner-2', rating: 4, comment: 'Good content, though a few more real-world examples would help.', learnerName: 'Alex Johnson', createdAt: '2026-04-21T09:00:00.000Z' },
];

const DEMO_QUIZ_STATS: QuizStat[] = [
  { lessonId: 'demo-lesson-4', lessonTitle: 'Safety Knowledge Check', courseId: 'demo-course-1', courseTitle: 'Workplace Safety Fundamentals', totalAttempts: 3, passRate: 67, avgScore: 72 },
  { lessonId: 'demo-lesson-9', lessonTitle: 'Leadership Quiz', courseId: 'demo-course-3', courseTitle: 'Leadership Essentials for New Managers', totalAttempts: 1, passRate: 100, avgScore: 100 },
];

const DEMO_AUDIT_EVENTS: OrgAuditEvent[] = [
  { id: 'demo-audit-1', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'invite', targetType: 'member', targetId: 'demo-learner-2', targetName: 'Alex Johnson', createdAt: '2026-02-01T09:15:00.000Z' },
  { id: 'demo-audit-2', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'invite', targetType: 'member', targetId: 'demo-learner-3', targetName: 'Priya Sharma', createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 'demo-audit-3', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'create_course', targetType: 'course', targetId: 'demo-course-1', targetName: 'Workplace Safety Fundamentals', createdAt: '2026-02-01T09:00:00.000Z' },
  { id: 'demo-audit-4', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'publish_course', targetType: 'course', targetId: 'demo-course-1', targetName: 'Workplace Safety Fundamentals', createdAt: '2026-02-01T09:05:00.000Z' },
  { id: 'demo-audit-5', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'enroll', targetType: 'enrollment', targetId: 'demo-enroll-1', targetName: 'Demo Learner → Workplace Safety Fundamentals', createdAt: '2026-03-01T09:00:00.000Z' },
  { id: 'demo-audit-6', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'enroll', targetType: 'enrollment', targetId: 'demo-enroll-3', targetName: 'Alex Johnson → Workplace Safety Fundamentals', createdAt: '2026-03-15T09:00:00.000Z' },
  { id: 'demo-audit-7', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'create_team', targetType: 'team', targetId: 'demo-team-1', targetName: 'Engineering', createdAt: '2026-01-10T09:00:00.000Z' },
  { id: 'demo-audit-8', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'create_path', targetType: 'path', targetId: 'demo-path-1', targetName: 'New Employee Onboarding', createdAt: '2026-02-15T09:00:00.000Z' },
  { id: 'demo-audit-9', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'update_org', targetType: 'org', targetId: 'demo-org', targetName: 'Acme Corp', createdAt: '2026-01-01T09:30:00.000Z' },
  { id: 'demo-audit-10', orgId: 'demo-org', actorId: 'demo-orgadmin', actorName: 'Demo Admin', action: 'invite', targetType: 'member', targetId: 'demo-learner-4', targetName: 'Marcus Webb', createdAt: '2026-03-01T11:00:00.000Z' },
];

const DEMO_ANNOUNCEMENTS: OrgAnnouncement[] = [
  { id: 'demo-ann-1', orgId: 'demo-org', title: 'Q2 Compliance Deadline', body: 'All mandatory compliance courses must be completed by 1 June 2026. Please check your learning dashboard and complete any outstanding courses before the deadline.', isActive: true, createdAt: '2026-04-28T09:00:00.000Z' },
  { id: 'demo-ann-2', orgId: 'demo-org', title: 'New Leadership Course Available', body: 'We\'ve added "Leadership Essentials for New Managers" to the course library. If you\'re a new or aspiring manager, we encourage you to enrol.', isActive: true, createdAt: '2026-03-10T09:00:00.000Z' },
];

// ─── State & actions ───────────────────────────────────────────────────────

interface OrgHubState {
  org: Organization | null;
  members: OrgMember[];
  teams: OrgTeam[];
  courses: Course[];
  enrollments: Enrollment[];
  paths: LearningPath[];
  announcements: OrgAnnouncement[];
  ratings: CourseRating[];
  quizStats: QuizStat[];
  auditEvents: OrgAuditEvent[];
  isHydrated: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface OrgHubActions {
  loadOrgHub: (orgId: string) => Promise<void>;
  // Courses
  createCourse: (data: Pick<Course, 'title' | 'description'>) => Promise<string>;
  updateCourse: (courseId: string, data: Partial<Pick<Course, 'title' | 'description' | 'isPublished' | 'estimatedMinutes' | 'thumbnailUrl' | 'category' | 'difficulty' | 'skills'>>) => Promise<void>;
  addModule: (courseId: string, title: string) => Promise<string>;
  updateModule: (moduleId: string, title: string) => Promise<void>;
  deleteModule: (courseId: string, moduleId: string) => Promise<void>;
  addLesson: (moduleId: string, data: Partial<CourseLesson> & Pick<CourseLesson, 'title' | 'kind'>) => Promise<string>;
  updateLesson: (lessonId: string, data: Partial<CourseLesson>) => Promise<void>;
  deleteLesson: (moduleId: string, lessonId: string) => Promise<void>;
  // Enrollments
  enrollLearners: (courseId: string, userIds: string[], opts?: { deadlineAt?: string; isMandatory?: boolean }) => Promise<void>;
  unenrollLearner: (enrollmentId: string) => Promise<void>;
  // Teams
  createTeam: (name: string) => Promise<string>;
  renameTeam: (teamId: string, name: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  enrollTeam: (teamId: string, courseId: string, opts?: { deadlineAt?: string; isMandatory?: boolean }) => Promise<void>;
  // Learning paths
  createPath: (data: Pick<LearningPath, 'title' | 'description'>) => Promise<string>;
  updatePath: (pathId: string, data: Partial<Pick<LearningPath, 'title' | 'description' | 'isPublished'>>) => Promise<void>;
  deletePath: (pathId: string) => Promise<void>;
  addCourseToPath: (pathId: string, courseId: string) => Promise<void>;
  removeCourseFromPath: (pathId: string, pathCourseId: string) => Promise<void>;
  enrollLearnersInPath: (pathId: string, userIds: string[]) => Promise<void>;
  // Members
  inviteMember: (email: string, orgRole: OrgMember['orgRole']) => Promise<'added' | 'pending'>;
  bulkInviteMembers: (rows: { email: string; name?: string; orgRole: OrgMember['orgRole']; jobTitle?: string; department?: string }[]) => Promise<{ ok: number; skipped: number }>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, orgRole: OrgMember['orgRole']) => Promise<void>;
  updateMemberManages: (userId: string, managedUserIds: string[]) => Promise<void>;
  // Announcements
  createAnnouncement: (data: Pick<OrgAnnouncement, 'title' | 'body' | 'expiresAt'>) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Pick<OrgAnnouncement, 'title' | 'body' | 'isActive' | 'expiresAt'>>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  // Ratings
  submitCourseRating: (data: { courseId: string; enrollmentId: string; orgId: string; userId?: string; rating: number; comment?: string; learnerName: string }) => Promise<void>;
  // Audit
  logAuditEvent: (action: AuditAction, targetType: OrgAuditEvent['targetType'], targetId: string, targetName: string) => void;
  // Org settings
  updateOrgDetails: (data: Partial<Pick<Organization, 'name' | 'logoUrl' | 'ssoProvider' | 'ssoIdpUrl' | 'ssoEntityId' | 'ssoCertificate' | 'remindersEnabled' | 'reminderDaysBefore' | 'reportScheduleEnabled' | 'reportScheduleFrequency' | 'reportScheduleEmail'>>) => Promise<void>;
  updateMemberProfile: (userId: string, data: { jobTitle?: string; department?: string }) => Promise<void>;
}

type OrgHubStore = OrgHubState & OrgHubActions;

// ─── Helpers ───────────────────────────────────────────────────────────────

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const mapLesson = (row: LessonRow): CourseLesson => ({
  id: row.id, moduleId: row.module_id, title: row.title,
  kind: row.kind as CourseLesson['kind'], position: row.position,
  contentBody: row.content_body || undefined, videoUrl: row.video_url || undefined,
  durationMinutes: row.duration_minutes || undefined,
  quizQuestions: Array.isArray(row.quiz_questions) ? row.quiz_questions as CourseLesson['quizQuestions'] : undefined,
  quizPassScore: row.quiz_pass_score ?? 80,
});

const mapModule = (row: ModuleRow, lessons: LessonRow[]): CourseModule => ({
  id: row.id, courseId: row.course_id, title: row.title, position: row.position,
  lessons: lessons.filter((l) => l.module_id === row.id).sort((a, b) => a.position - b.position).map(mapLesson),
});

const mapCourse = (row: CourseRow, modules: ModuleRow[], lessons: LessonRow[]): Course => ({
  id: row.id, orgId: row.org_id || undefined, createdByUserId: row.created_by_user_id,
  title: row.title, description: row.description || '', thumbnailUrl: row.thumbnail_url || undefined,
  isPublished: row.is_published,
  category: (row.category as CourseCategory) || undefined,
  difficulty: (row.difficulty as CourseDifficulty) || undefined,
  estimatedMinutes: row.estimated_minutes || undefined,
  skills: row.skills?.length ? row.skills : undefined,
  modules: modules.filter((m) => m.course_id === row.id).sort((a, b) => a.position - b.position).map((m) => mapModule(m, lessons)),
  createdAt: row.created_at, updatedAt: row.updated_at,
});

// ─── Store ─────────────────────────────────────────────────────────────────

export const useOrgHubStore = create<OrgHubStore>((set, get) => ({
  org: null, members: [], teams: [], courses: [], enrollments: [],
  paths: [], announcements: [], ratings: [], quizStats: [], auditEvents: [], isHydrated: false, isSyncing: false, error: null,

  loadOrgHub: async (orgId: string) => {
    const { isHydrated, org } = get();
    if (isHydrated && org?.id === orgId) return;
    set({ isSyncing: true, error: null });

    if (orgId === 'demo-org') {
      set({ org: DEMO_ORG, members: DEMO_MEMBERS, teams: DEMO_TEAMS, courses: DEMO_COURSES, enrollments: DEMO_ENROLLMENTS, paths: DEMO_PATHS, announcements: DEMO_ANNOUNCEMENTS, ratings: DEMO_RATINGS, quizStats: DEMO_QUIZ_STATS, auditEvents: DEMO_AUDIT_EVENTS, isHydrated: true, isSyncing: false });
      return;
    }

    if (!hasSupabaseConfig) { set({ isSyncing: false, error: 'Supabase not configured.', isHydrated: true }); return; }

    try {
      const [orgRes, membersRes, coursesRes, enrollmentsRes, teamsRes, pathsRes, announcementsRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', orgId).single(),
        supabase.from('org_members').select('user_id, org_role, joined_at, job_title, department, manager_user_id, profiles(full_name, email)').eq('org_id', orgId),
        supabase.from('courses').select('*').eq('org_id', orgId),
        supabase.from('course_enrollments').select('id, course_id, user_id, org_id, is_mandatory, enrolled_at, deadline_at, completed_at, profiles(full_name, email), courses(title), lesson_completions(lesson_id)').eq('org_id', orgId),
        supabase.from('org_teams').select('id, org_id, name, created_at, org_team_members(user_id)').eq('org_id', orgId),
        supabase.from('learning_paths').select('id, org_id, title, description, is_published, created_at, updated_at, learning_path_courses(id, path_id, course_id, position)').eq('org_id', orgId),
        supabase.from('org_announcements').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
      ]);

      if (orgRes.error || !orgRes.data) throw new Error('Could not load organisation.');

      const orgRow = orgRes.data as OrgRow;
      const org: Organization = {
        id: orgRow.id, name: orgRow.name, slug: orgRow.slug,
        logoUrl: orgRow.logo_url || undefined, seatLimit: orgRow.seat_limit, createdAt: orgRow.created_at,
        ssoProvider: orgRow.sso_provider || undefined, ssoIdpUrl: orgRow.sso_idp_url || undefined,
        ssoEntityId: orgRow.sso_entity_id || undefined, ssoCertificate: orgRow.sso_certificate || undefined,
        remindersEnabled: orgRow.reminders_enabled ?? false, reminderDaysBefore: orgRow.reminder_days_before ?? 3,
        reportScheduleEnabled: orgRow.report_schedule_enabled ?? false,
        reportScheduleFrequency: orgRow.report_schedule_frequency ?? 'weekly',
        reportScheduleEmail: orgRow.report_schedule_email ?? '',
      };

      const memberRows2 = (membersRes.data || []) as unknown as OrgMemberRow[];
      const members: OrgMember[] = memberRows2.map((row) => ({
        userId: row.user_id,
        name: (row.profiles as { full_name: string })?.full_name || '',
        email: (row.profiles as { email: string })?.email || '',
        orgRole: row.org_role as OrgMember['orgRole'],
        joinedAt: row.joined_at,
        jobTitle: row.job_title || undefined,
        department: row.department || undefined,
        managedUserIds: memberRows2.filter((r) => r.manager_user_id === row.user_id).map((r) => r.user_id),
      }));

      const teams: OrgTeam[] = ((teamsRes.data || []) as unknown as (TeamRow & { org_team_members: TeamMemberRow[] })[]).map((row) => ({
        id: row.id, orgId: row.org_id, name: row.name, createdAt: row.created_at,
        memberIds: (row.org_team_members || []).map((tm) => tm.user_id),
      }));

      const courseRows = (coursesRes.data || []) as CourseRow[];
      let modules: ModuleRow[] = [];
      let lessons: LessonRow[] = [];

      if (courseRows.length > 0) {
        const [modsRes] = await Promise.all([supabase.from('course_modules').select('*').in('course_id', courseRows.map((c) => c.id))]);
        modules = (modsRes.data || []) as ModuleRow[];
        const moduleIds = modules.map((m) => m.id);
        if (moduleIds.length > 0) {
          const lessonsRes2 = await supabase.from('course_lessons').select('*').in('module_id', moduleIds);
          lessons = (lessonsRes2.data || []) as LessonRow[];
        }
      }

      const courses = courseRows.map((row) => mapCourse(row, modules, lessons));

      const enrollmentRows = (enrollmentsRes.data || []) as unknown as EnrollmentRow[];
      const enrollments: Enrollment[] = enrollmentRows.map((row) => {
        const course = courses.find((c) => c.id === row.course_id);
        const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
        const completedLessons = row.lesson_completions?.length ?? 0;
        return {
          id: row.id, courseId: row.course_id,
          courseTitle: (row.courses as { title: string })?.title || '',
          userId: row.user_id,
          userName: (row.profiles as { full_name: string })?.full_name || '',
          userEmail: (row.profiles as { email: string })?.email || '',
          orgId: row.org_id, enrolledAt: row.enrolled_at,
          deadlineAt: row.deadline_at || undefined, completedAt: row.completed_at || undefined,
          completionPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          hasCertificate: Boolean(row.completed_at), isMandatory: row.is_mandatory ?? false,
        };
      });

      const pathsData = (pathsRes.data || []) as unknown as (PathRow & { learning_path_courses: PathCourseRow[] })[];
      const paths: LearningPath[] = pathsData.map((row) => {
        const pathCourses: PathCourse[] = (row.learning_path_courses || [])
          .sort((a, b) => a.position - b.position)
          .map((pc) => {
            const c = courses.find((x) => x.id === pc.course_id);
            return {
              id: pc.id, pathId: pc.path_id, courseId: pc.course_id,
              courseTitle: c?.title || '', position: pc.position,
              estimatedMinutes: c?.estimatedMinutes,
              totalLessons: c?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0,
            };
          });
        return { id: row.id, orgId: row.org_id, title: row.title, description: row.description || '', isPublished: row.is_published, courses: pathCourses, createdAt: row.created_at, updatedAt: row.updated_at };
      });

      const announcements: OrgAnnouncement[] = ((announcementsRes.data || []) as AnnouncementRow[]).map((row) => ({
        id: row.id, orgId: row.org_id, title: row.title, body: row.body,
        isActive: row.is_active, createdAt: row.created_at, expiresAt: row.expires_at || undefined,
      }));

      // Fetch ratings and quiz stats
      const ratingsRes = await supabase.from('course_ratings').select('id, course_id, enrollment_id, user_id, rating, comment, created_at, profiles(full_name)').eq('org_id', orgId);
      const ratings: CourseRating[] = ((ratingsRes.data || []) as unknown as RatingRow[]).map((r) => ({
        id: r.id, courseId: r.course_id, enrollmentId: r.enrollment_id, userId: r.user_id,
        rating: r.rating, comment: r.comment || undefined,
        learnerName: (r.profiles as { full_name: string })?.full_name || '',
        createdAt: r.created_at,
      }));

      // Quiz stats: lesson_completions where quiz_score is not null, grouped by lesson
      const quizLessonIds = lessons.filter((l) => l.kind === 'quiz').map((l) => l.id);
      let quizStats: QuizStat[] = [];
      if (quizLessonIds.length > 0) {
        const attemptsRes = await supabase.from('lesson_completions').select('lesson_id, quiz_score').in('lesson_id', quizLessonIds).not('quiz_score', 'is', null);
        const attempts = (attemptsRes.data || []) as { lesson_id: string; quiz_score: number }[];
        quizStats = quizLessonIds.map((lid) => {
          const lesson = lessons.find((l) => l.id === lid);
          const mod = modules.find((m) => m.id === lesson?.module_id);
          const course = courses.find((c) => c.id === mod?.course_id);
          const lAttempts = attempts.filter((a) => a.lesson_id === lid);
          const passScore = lesson?.quiz_pass_score ?? 80;
          const passing = lAttempts.filter((a) => a.quiz_score >= passScore).length;
          const avg = lAttempts.length > 0 ? Math.round(lAttempts.reduce((s, a) => s + a.quiz_score, 0) / lAttempts.length) : 0;
          return {
            lessonId: lid, lessonTitle: lesson?.title || '', courseId: course?.id || '', courseTitle: course?.title || '',
            totalAttempts: lAttempts.length, passRate: lAttempts.length > 0 ? Math.round((passing / lAttempts.length) * 100) : 0, avgScore: avg,
          };
        }).filter((s) => s.totalAttempts > 0);
      }

      set({ org, members, teams, courses, enrollments, paths, announcements, ratings, quizStats, auditEvents: [], isHydrated: true, isSyncing: false, error: null });
    } catch (error) {
      set({ isSyncing: false, error: error instanceof Error ? error.message : 'Failed to load organisation.', isHydrated: true });
    }
  },

  // ── Courses ───────────────────────────────────────────────────────────────

  createCourse: async (data) => {
    const { org } = get();
    if (!org) throw new Error('No active organisation.');
    if (org.id === 'demo-org') {
      const newId = randomId('course');
      const newCourse: Course = { id: newId, orgId: 'demo-org', createdByUserId: 'demo-orgadmin', title: data.title, description: data.description, isPublished: false, modules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      set((state) => ({ courses: [newCourse, ...state.courses] }));
      return newId;
    }
    const { data: row, error } = await supabase.from('courses').insert({ org_id: org.id, title: data.title, description: data.description }).select().single();
    if (error || !row) throw new Error('Could not create course.');
    set((state) => ({ courses: [mapCourse(row as CourseRow, [], []), ...state.courses] }));
    return row.id as string;
  },

  updateCourse: async (courseId, data) => {
    const { org } = get();
    if (org?.id === 'demo-org') {
      set((state) => ({ courses: state.courses.map((c) => c.id === courseId ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
      return;
    }
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isPublished !== undefined) payload.is_published = data.isPublished;
    if (data.estimatedMinutes !== undefined) payload.estimated_minutes = data.estimatedMinutes;
    if (data.thumbnailUrl !== undefined) payload.thumbnail_url = data.thumbnailUrl;
    if (data.category !== undefined) payload.category = data.category;
    if (data.difficulty !== undefined) payload.difficulty = data.difficulty;
    if (data.skills !== undefined) payload.skills = data.skills;
    const { error } = await supabase.from('courses').update(payload).eq('id', courseId);
    if (error) throw new Error('Could not update course.');
    set((state) => ({ courses: state.courses.map((c) => c.id === courseId ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
  },

  addModule: async (courseId, title) => {
    const { org, courses } = get();
    const position = (courses.find((c) => c.id === courseId)?.modules.length ?? 0) + 1;
    if (org?.id === 'demo-org') {
      const newId = randomId('mod');
      set((state) => ({ courses: state.courses.map((c) => c.id === courseId ? { ...c, modules: [...c.modules, { id: newId, courseId, title, position, lessons: [] }] } : c) }));
      return newId;
    }
    const { data, error } = await supabase.from('course_modules').insert({ course_id: courseId, title, position }).select().single();
    if (error || !data) throw new Error('Could not add module.');
    set((state) => ({ courses: state.courses.map((c) => c.id === courseId ? { ...c, modules: [...c.modules, { id: data.id as string, courseId, title, position, lessons: [] }] } : c) }));
    return data.id as string;
  },

  updateModule: async (moduleId, title) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('course_modules').update({ title }).eq('id', moduleId); if (error) throw new Error('Could not update module.'); }
    set((state) => ({ courses: state.courses.map((c) => ({ ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, title } : m) })) }));
  },

  deleteModule: async (courseId, moduleId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('course_modules').delete().eq('id', moduleId); if (error) throw new Error('Could not delete module.'); }
    set((state) => ({ courses: state.courses.map((c) => c.id === courseId ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) } : c) }));
  },

  addLesson: async (moduleId, data) => {
    const { org, courses } = get();
    const position = (courses.flatMap((c) => c.modules).find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1;
    if (org?.id === 'demo-org') {
      const newId = randomId('lesson');
      const { kind, title, quizPassScore: qps, ...rest } = data;
      const newLesson: CourseLesson = { ...rest, id: newId, moduleId, position, kind, title, quizPassScore: qps ?? 80 };
      set((state) => ({ courses: state.courses.map((c) => ({ ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m) })) }));
      return newId;
    }
    const payload = { module_id: moduleId, title: data.title, kind: data.kind, position, content_body: data.contentBody || null, video_url: data.videoUrl || null, duration_minutes: data.durationMinutes || null, quiz_questions: data.quizQuestions || null, quiz_pass_score: data.quizPassScore ?? 80 };
    const { data: row, error } = await supabase.from('course_lessons').insert(payload).select().single();
    if (error || !row) throw new Error('Could not add lesson.');
    const newLesson = mapLesson(row as LessonRow);
    set((state) => ({ courses: state.courses.map((c) => ({ ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m) })) }));
    return row.id as string;
  },

  updateLesson: async (lessonId, data) => {
    const { org } = get();
    if (org?.id !== 'demo-org') {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.contentBody !== undefined) payload.content_body = data.contentBody;
      if (data.videoUrl !== undefined) payload.video_url = data.videoUrl;
      if (data.durationMinutes !== undefined) payload.duration_minutes = data.durationMinutes;
      if (data.quizQuestions !== undefined) payload.quiz_questions = data.quizQuestions;
      if (data.quizPassScore !== undefined) payload.quiz_pass_score = data.quizPassScore;
      const { error } = await supabase.from('course_lessons').update(payload).eq('id', lessonId);
      if (error) throw new Error('Could not update lesson.');
    }
    set((state) => ({ courses: state.courses.map((c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...data } : l) })) })) }));
  },

  deleteLesson: async (moduleId, lessonId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId); if (error) throw new Error('Could not delete lesson.'); }
    set((state) => ({ courses: state.courses.map((c) => ({ ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m) })) }));
  },

  // ── Enrollments ───────────────────────────────────────────────────────────

  enrollLearners: async (courseId, userIds, opts = {}) => {
    const { org, courses, enrollments, members } = get();
    if (!org) throw new Error('No active organisation.');
    const course = courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found.');

    if (org.id === 'demo-org') {
      const newEnrollments: Enrollment[] = userIds
        .filter((uid) => !enrollments.some((e) => e.courseId === courseId && e.userId === uid))
        .map((uid) => {
          const member = members.find((m) => m.userId === uid);
          return { id: randomId('enroll'), courseId, courseTitle: course.title, userId: uid, userName: member?.name || uid, userEmail: member?.email || '', orgId: org.id, enrolledAt: new Date().toISOString(), deadlineAt: opts.deadlineAt, completionPercent: 0, hasCertificate: false, isMandatory: opts.isMandatory ?? false };
        });
      set({ enrollments: [...enrollments, ...newEnrollments] });
      return;
    }

    const rows = userIds.map((uid) => ({ course_id: courseId, user_id: uid, org_id: org.id, deadline_at: opts.deadlineAt || null, is_mandatory: opts.isMandatory ?? false }));
    const { error } = await supabase.from('course_enrollments').upsert(rows, { onConflict: 'course_id,user_id,org_id' });
    if (error) throw new Error('Could not enrol learners.');
    set({ isHydrated: false });
    await get().loadOrgHub(org.id);
  },

  unenrollLearner: async (enrollmentId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') {
      const { error } = await supabase.from('course_enrollments').delete().eq('id', enrollmentId);
      if (error) throw new Error('Could not unenrol learner.');
    }
    set((state) => ({ enrollments: state.enrollments.filter((e) => e.id !== enrollmentId) }));
  },

  // ── Teams ─────────────────────────────────────────────────────────────────

  createTeam: async (name) => {
    const { org, teams } = get();
    if (!org) throw new Error('No active organisation.');
    if (org.id === 'demo-org') {
      const newId = randomId('team');
      set({ teams: [...teams, { id: newId, orgId: org.id, name, memberIds: [], createdAt: new Date().toISOString() }] });
      return newId;
    }
    const { data, error } = await supabase.from('org_teams').insert({ org_id: org.id, name }).select().single();
    if (error || !data) throw new Error('Could not create team.');
    set((state) => ({ teams: [...state.teams, { id: (data as TeamRow).id, orgId: org.id, name, memberIds: [], createdAt: (data as TeamRow).created_at }] }));
    return (data as TeamRow).id;
  },

  renameTeam: async (teamId, name) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('org_teams').update({ name }).eq('id', teamId); if (error) throw new Error('Could not rename team.'); }
    set((state) => ({ teams: state.teams.map((t) => t.id === teamId ? { ...t, name } : t) }));
  },

  deleteTeam: async (teamId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('org_teams').delete().eq('id', teamId); if (error) throw new Error('Could not delete team.'); }
    set((state) => ({ teams: state.teams.filter((t) => t.id !== teamId) }));
  },

  addTeamMember: async (teamId, userId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('org_team_members').insert({ team_id: teamId, user_id: userId }); if (error) throw new Error('Could not add team member.'); }
    set((state) => ({ teams: state.teams.map((t) => t.id === teamId ? { ...t, memberIds: [...new Set([...t.memberIds, userId])] } : t) }));
  },

  removeTeamMember: async (teamId, userId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('org_team_members').delete().eq('team_id', teamId).eq('user_id', userId); if (error) throw new Error('Could not remove team member.'); }
    set((state) => ({ teams: state.teams.map((t) => t.id === teamId ? { ...t, memberIds: t.memberIds.filter((id) => id !== userId) } : t) }));
  },

  enrollTeam: async (teamId, courseId, opts = {}) => {
    const { teams } = get();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found.');
    await get().enrollLearners(courseId, team.memberIds, opts);
  },

  // ── Learning paths ────────────────────────────────────────────────────────

  createPath: async (data) => {
    const { org, paths } = get();
    if (!org) throw new Error('No active organisation.');
    if (org.id === 'demo-org') {
      const newId = randomId('path');
      const newPath: LearningPath = { id: newId, orgId: org.id, title: data.title, description: data.description, isPublished: false, courses: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      set({ paths: [newPath, ...paths] });
      return newId;
    }
    const { data: row, error } = await supabase.from('learning_paths').insert({ org_id: org.id, title: data.title, description: data.description }).select().single();
    if (error || !row) throw new Error('Could not create learning path.');
    const newPath: LearningPath = { id: (row as PathRow).id, orgId: org.id, title: data.title, description: data.description, isPublished: false, courses: [], createdAt: (row as PathRow).created_at, updatedAt: (row as PathRow).updated_at };
    set((state) => ({ paths: [newPath, ...state.paths] }));
    return (row as PathRow).id;
  },

  updatePath: async (pathId, data) => {
    const { org } = get();
    if (org?.id !== 'demo-org') {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description;
      if (data.isPublished !== undefined) payload.is_published = data.isPublished;
      const { error } = await supabase.from('learning_paths').update(payload).eq('id', pathId);
      if (error) throw new Error('Could not update learning path.');
    }
    set((state) => ({ paths: state.paths.map((p) => p.id === pathId ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) }));
  },

  deletePath: async (pathId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('learning_paths').delete().eq('id', pathId); if (error) throw new Error('Could not delete learning path.'); }
    set((state) => ({ paths: state.paths.filter((p) => p.id !== pathId) }));
  },

  addCourseToPath: async (pathId, courseId) => {
    const { org, courses, paths } = get();
    const path = paths.find((p) => p.id === pathId);
    if (!path) throw new Error('Path not found.');
    if (path.courses.some((pc) => pc.courseId === courseId)) return;
    const position = path.courses.length + 1;
    const course = courses.find((c) => c.id === courseId);

    if (org?.id === 'demo-org') {
      const newPc: PathCourse = { id: randomId('pc'), pathId, courseId, courseTitle: course?.title || '', position, estimatedMinutes: course?.estimatedMinutes, totalLessons: course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0 };
      set((state) => ({ paths: state.paths.map((p) => p.id === pathId ? { ...p, courses: [...p.courses, newPc] } : p) }));
      return;
    }
    const { data, error } = await supabase.from('learning_path_courses').insert({ path_id: pathId, course_id: courseId, position }).select().single();
    if (error || !data) throw new Error('Could not add course to path.');
    const newPc: PathCourse = { id: (data as PathCourseRow).id, pathId, courseId, courseTitle: course?.title || '', position, estimatedMinutes: course?.estimatedMinutes, totalLessons: course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0 };
    set((state) => ({ paths: state.paths.map((p) => p.id === pathId ? { ...p, courses: [...p.courses, newPc] } : p) }));
  },

  removeCourseFromPath: async (pathId, pathCourseId) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('learning_path_courses').delete().eq('id', pathCourseId); if (error) throw new Error('Could not remove course from path.'); }
    set((state) => ({ paths: state.paths.map((p) => p.id === pathId ? { ...p, courses: p.courses.filter((pc) => pc.id !== pathCourseId) } : p) }));
  },

  enrollLearnersInPath: async (pathId, userIds) => {
    const { org, paths } = get();
    if (!org) throw new Error('No active organisation.');
    const path = paths.find((p) => p.id === pathId);
    if (!path) throw new Error('Path not found.');

    // Enrol into each course in the path (in order)
    for (const pc of path.courses) {
      await get().enrollLearners(pc.courseId, userIds, { isMandatory: true });
    }

    if (org.id !== 'demo-org') {
      const rows = userIds.map((uid) => ({ path_id: pathId, user_id: uid, org_id: org.id }));
      await supabase.from('learning_path_enrollments').upsert(rows, { onConflict: 'path_id,user_id,org_id' });
    }
  },

  // ── Members ───────────────────────────────────────────────────────────────

  inviteMember: async (email, orgRole) => {
    const { org, members } = get();
    if (!org) throw new Error('No active organisation.');

    if (orgRole === 'learner' || orgRole === 'manager') {
      const currentCount = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager').length;
      if (currentCount >= org.seatLimit) {
        throw new Error(`Seat limit reached (${org.seatLimit} seats). Upgrade your plan to add more learners.`);
      }
    }

    if (org.id === 'demo-org') {
      set({ members: [...members, { userId: randomId('user'), name: email.split('@')[0], email, orgRole, joinedAt: new Date().toISOString() }] });
      return 'added';
    }
    const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('email', email.trim().toLowerCase()).single();
    if (!profile) {
      const { error: inviteErr } = await supabase.from('org_pending_invites').upsert(
        { org_id: org.id, email: email.trim().toLowerCase(), org_role: orgRole },
        { onConflict: 'org_id,email' },
      );
      if (inviteErr) throw new Error('Could not send invite.');
      return 'pending';
    }
    const { error } = await supabase.from('org_members').insert({ org_id: org.id, user_id: (profile as { id: string }).id, org_role: orgRole });
    if (error) throw new Error('Could not add member. They may already be in this organisation.');
    set({ members: [...members, { userId: (profile as { id: string }).id, name: (profile as { full_name: string }).full_name || email, email: (profile as { email: string }).email, orgRole, joinedAt: new Date().toISOString() }] });
    return 'added';
  },

  removeMember: async (userId) => {
    const { org } = get();
    if (!org) return;
    if (org.id !== 'demo-org') { const { error } = await supabase.from('org_members').delete().eq('org_id', org.id).eq('user_id', userId); if (error) throw new Error('Could not remove member.'); }
    set((state) => ({ members: state.members.filter((m) => m.userId !== userId) }));
  },

  bulkInviteMembers: async (rows) => {
    let ok = 0; let skipped = 0;
    for (const row of rows) {
      try {
        const result = await get().inviteMember(row.email, row.orgRole);
        if (result === 'added' && (row.name || row.jobTitle || row.department)) {
          const { members } = get();
          const added = members.find((m) => m.email === row.email);
          if (added) {
            const updates: Record<string, unknown> = {};
            if (row.name) updates.name = row.name;
            if (row.jobTitle) updates.jobTitle = row.jobTitle;
            if (row.department) updates.department = row.department;
            set((s) => ({ members: s.members.map((m) => m.email === row.email ? { ...m, ...updates } : m) }));
          }
        }
        ok++;
      } catch { skipped++; }
    }
    return { ok, skipped };
  },

  updateMemberRole: async (userId, orgRole) => {
    const { org } = get();
    if (org?.id !== 'demo-org' && hasSupabaseConfig) {
      const { error } = await supabase.from('org_members').update({ org_role: orgRole }).eq('user_id', userId).eq('org_id', org?.id ?? '');
      if (error) throw new Error('Could not update member role.');
    }
    set((s) => ({ members: s.members.map((m) => m.userId === userId ? { ...m, orgRole } : m) }));
  },

  updateMemberManages: async (userId, managedUserIds) => {
    const { org } = get();
    if (org && org.id !== 'demo-org' && hasSupabaseConfig) {
      // Clear previous reports for this manager, then assign new ones.
      await supabase.from('org_members').update({ manager_user_id: null }).eq('org_id', org.id).eq('manager_user_id', userId);
      if (managedUserIds.length > 0) {
        await supabase.from('org_members').update({ manager_user_id: userId }).eq('org_id', org.id).in('user_id', managedUserIds);
      }
    }
    set((s) => ({
      members: s.members.map((m) =>
        m.userId === userId
          ? { ...m, managedUserIds }
          : managedUserIds.includes(m.userId)
            ? m
            : m.managedUserIds
              ? { ...m }
              : m
      ),
    }));
  },

  logAuditEvent: (action, targetType, targetId, targetName) => {
    const { org, auditEvents } = get();
    if (!org) return;
    const evt: OrgAuditEvent = {
      id: randomId('audit'), orgId: org.id, actorId: 'current-user', actorName: 'Admin',
      action, targetType, targetId, targetName, createdAt: new Date().toISOString(),
    };
    set({ auditEvents: [evt, ...auditEvents] });
  },

  // ── Announcements ─────────────────────────────────────────────────────────

  createAnnouncement: async (data) => {
    const { org, announcements } = get();
    if (!org) throw new Error('No active organisation.');
    if (org.id === 'demo-org') {
      set({ announcements: [{ id: randomId('ann'), orgId: org.id, title: data.title, body: data.body, isActive: true, createdAt: new Date().toISOString(), expiresAt: data.expiresAt }, ...announcements] });
      return;
    }
    const { data: row, error } = await supabase.from('org_announcements').insert({ org_id: org.id, title: data.title, body: data.body, expires_at: data.expiresAt || null }).select().single();
    if (error || !row) throw new Error('Could not create announcement.');
    const ann = row as AnnouncementRow;
    set((state) => ({ announcements: [{ id: ann.id, orgId: org.id, title: ann.title, body: ann.body, isActive: ann.is_active, createdAt: ann.created_at, expiresAt: ann.expires_at || undefined }, ...state.announcements] }));
  },

  updateAnnouncement: async (id, data) => {
    const { org } = get();
    if (org?.id !== 'demo-org') {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.body !== undefined) payload.body = data.body;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      if (data.expiresAt !== undefined) payload.expires_at = data.expiresAt;
      const { error } = await supabase.from('org_announcements').update(payload).eq('id', id);
      if (error) throw new Error('Could not update announcement.');
    }
    set((state) => ({ announcements: state.announcements.map((a) => a.id === id ? { ...a, ...data } : a) }));
  },

  deleteAnnouncement: async (id) => {
    const { org } = get();
    if (org?.id !== 'demo-org') { const { error } = await supabase.from('org_announcements').delete().eq('id', id); if (error) throw new Error('Could not delete announcement.'); }
    set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
  },

  // ── Org settings ──────────────────────────────────────────────────────────

  submitCourseRating: async (data) => {
    const { org } = get();
    const newRating: CourseRating = { id: randomId('rating'), userId: data.userId ?? '', ...data, createdAt: new Date().toISOString() };
    if (org?.id === 'demo-org') { set((s) => ({ ratings: [newRating, ...s.ratings] })); return; }
    if (!hasSupabaseConfig) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('course_ratings').upsert({
      course_id: data.courseId, enrollment_id: data.enrollmentId, user_id: user.id,
      org_id: data.orgId, rating: data.rating, comment: data.comment ?? null,
    }, { onConflict: 'enrollment_id' });
    if (error) throw new Error('Could not submit rating.');
    set((s) => ({ ratings: [newRating, ...s.ratings.filter((r) => r.enrollmentId !== data.enrollmentId)] }));
  },

  updateOrgDetails: async (data) => {
    const { org } = get();
    if (!org) return;
    if (org.id === 'demo-org') { set({ org: { ...org, ...data } }); return; }
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
    if (data.ssoProvider !== undefined) payload.sso_provider = data.ssoProvider || null;
    if (data.ssoIdpUrl !== undefined) payload.sso_idp_url = data.ssoIdpUrl || null;
    if (data.ssoEntityId !== undefined) payload.sso_entity_id = data.ssoEntityId || null;
    if (data.ssoCertificate !== undefined) payload.sso_certificate = data.ssoCertificate || null;
    if (data.remindersEnabled !== undefined) payload.reminders_enabled = data.remindersEnabled;
    if (data.reminderDaysBefore !== undefined) payload.reminder_days_before = data.reminderDaysBefore;
    if (data.reportScheduleEnabled !== undefined) payload.report_schedule_enabled = data.reportScheduleEnabled;
    if (data.reportScheduleFrequency !== undefined) payload.report_schedule_frequency = data.reportScheduleFrequency;
    if (data.reportScheduleEmail !== undefined) payload.report_schedule_email = data.reportScheduleEmail;
    const { error } = await supabase.from('organizations').update(payload).eq('id', org.id);
    if (error) throw new Error('Could not update organisation.');
    set({ org: { ...org, ...data } });
  },

  updateMemberProfile: async (userId, data) => {
    const { org } = get();
    if (org?.id === 'demo-org') {
      set((s) => ({ members: s.members.map((m) => m.userId === userId ? { ...m, ...data } : m) }));
      return;
    }
    if (!hasSupabaseConfig) return;
    const payload: Record<string, unknown> = {};
    if (data.jobTitle !== undefined) payload.job_title = data.jobTitle || null;
    if (data.department !== undefined) payload.department = data.department || null;
    const { error } = await supabase.from('org_members').update(payload).eq('user_id', userId).eq('org_id', org?.id ?? '');
    if (error) throw new Error('Could not update member profile.');
    set((s) => ({ members: s.members.map((m) => m.userId === userId ? { ...m, ...data } : m) }));
  },
}));

export const isDemoOrg = (orgId: string | null) => orgId === 'demo-org';
