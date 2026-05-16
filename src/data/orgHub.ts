export type OrgRole = 'admin' | 'instructor' | 'learner' | 'manager';
export type CourseLessonKind = 'video' | 'text' | 'quiz' | 'live';
export type CourseCategory = 'compliance' | 'leadership' | 'technical' | 'soft-skills' | 'onboarding' | 'health-safety' | 'other';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type AuditAction = 'enroll' | 'unenroll' | 'invite' | 'remove_member' | 'publish_course' | 'create_course' | 'delete_course' | 'create_team' | 'delete_team' | 'update_org' | 'create_path' | 'enroll_path';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  seatLimit: number;
  createdAt: string;
  // SSO
  ssoProvider?: string;
  ssoIdpUrl?: string;
  ssoEntityId?: string;
  ssoCertificate?: string;
  // Reminders
  remindersEnabled: boolean;
  reminderDaysBefore: number;
  // Scheduled reports
  reportScheduleEnabled: boolean;
  reportScheduleFrequency: 'weekly' | 'monthly';
  reportScheduleEmail: string;
}

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  orgRole: OrgRole;
  joinedAt: string;
  teamIds?: string[];
  jobTitle?: string;
  department?: string;
  managedUserIds?: string[];
}

export interface OrgAuditEvent {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  targetType: 'member' | 'course' | 'enrollment' | 'team' | 'path' | 'org';
  targetId: string;
  targetName: string;
  createdAt: string;
}

export interface OrgTeam {
  id: string;
  orgId: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  kind: CourseLessonKind;
  position: number;
  contentBody?: string;
  videoUrl?: string;
  durationMinutes?: number;
  quizQuestions?: QuizQuestion[];
  quizPassScore: number;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  orgId?: string;
  createdByUserId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  estimatedMinutes?: number;
  skills?: string[];
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  orgId: string;
  enrolledAt: string;
  deadlineAt?: string;
  completedAt?: string;
  completionPercent: number;
  hasCertificate: boolean;
  isMandatory: boolean;
}

export interface LearnerCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  estimatedMinutes?: number;
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  skills?: string[];
  orgName: string;
  enrolledAt: string;
  deadlineAt?: string;
  completedAt?: string;
  completionPercent: number;
  totalLessons: number;
  completedLessons: number;
  hasCertificate: boolean;
  isMandatory: boolean;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  orgName: string;
  issuedAt: string;
  certificateUrl?: string;
}

export interface LearningPath {
  id: string;
  orgId: string;
  title: string;
  description: string;
  isPublished: boolean;
  courses: PathCourse[];
  createdAt: string;
  updatedAt: string;
}

export interface PathCourse {
  id: string;
  pathId: string;
  courseId: string;
  courseTitle: string;
  position: number;
  estimatedMinutes?: number;
  totalLessons: number;
}

export interface LearnerPath {
  pathId: string;
  title: string;
  description: string;
  enrolledAt: string;
  completedAt?: string;
  completionPercent: number;
  courses: LearnerPathCourse[];
}

export interface LearnerPathCourse {
  courseId: string;
  courseTitle: string;
  position: number;
  isUnlocked: boolean;
  completionPercent: number;
  completedAt?: string;
  enrollmentId?: string;
  estimatedMinutes?: number;
}

export interface OrgAnnouncement {
  id: string;
  orgId: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface CourseRating {
  id: string;
  courseId: string;
  enrollmentId: string;
  userId: string;
  rating: number;
  comment?: string;
  learnerName: string;
  createdAt: string;
}

export interface QuizStat {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  passRate: number;
  avgScore: number;
}

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgRole: OrgRole;
}
