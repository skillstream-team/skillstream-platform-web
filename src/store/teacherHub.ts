import { create } from 'zustand';
import {
  ClassMessage,
  ClassResourceKind,
  DirectConversationMessage,
  DirectConversationSummary,
  LessonSummary,
  PaymentRecord,
  PaymentStatus,
  StudentSummary,
  TeacherClass,
  TeacherTask,
  AssignmentSummary,
  ClassResourceSummary,
  TopicInsight,
  buildTeacherTasks,
  normalizeLessonStatus,
} from '../data/teacherHub';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { trackAnalyticsEvent } from '../lib/analytics';
import { useAuthStore } from './auth';

interface TeacherHubState {
  classes: TeacherClass[];
  directConversations: DirectConversationSummary[];
  students: StudentSummary[];
  payments: PaymentRecord[];
  tasks: TeacherTask[];
  revision: number;
  isHydrated: boolean;
  isSyncing: boolean;
  error: string | null;
  undoItem: {
    id: string;
    label: string;
    kind: 'lesson' | 'message';
    classId: string;
    targetId: string;
    expiresAt: number;
  } | null;
}

interface TeacherHubActions {
  loadWorkspace: () => Promise<void>;
  createClass: (input: { name: string; overview: string; accent?: string }) => Promise<void>;
  updateClassDetails: (classId: string, input: { name: string; overview: string }) => Promise<void>;
  archiveClass: (classId: string) => Promise<void>;
  refreshInvite: (classId: string) => Promise<void>;
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  inviteStudentByEmail: (classId: string, email: string) => Promise<{ status: 'added_existing' | 'invited_new' | 'already_member'; message: string }>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  scheduleLesson: (input: { classId: string; title: string; scheduledAt: string; durationMinutes: number }) => Promise<void>;
  scheduleLessonSeries: (input: { classId: string; title: string; firstScheduledAt: string; durationMinutes: number; occurrences: number }) => Promise<void>;
  rescheduleLesson: (classId: string, lessonId: string, scheduledAt: string) => Promise<void>;
  cancelLesson: (classId: string, lessonId: string) => Promise<void>;
  createAssignment: (input: {
    classId: string;
    title: string;
    description: string;
    resources: Array<{ title: string; url: string }>;
    files?: File[];
    dueAt: string;
    assignedTo: 'class' | 'individuals';
    assignedStudentIds?: string[];
  }) => Promise<void>;
  submitAssignment: (input: {
    classId: string;
    assignmentId: string;
    submissionNote: string;
    file: File;
  }) => Promise<void>;
  gradeAssignmentSubmission: (input: {
    classId: string;
    assignmentId: string;
    submissionId: string;
    gradeScore: number;
    feedback: string;
  }) => Promise<void>;
  sendClassMessage: (classId: string, body: string) => Promise<void>;
  uploadClassResource: (input: {
    classId: string;
    title: string;
    description: string;
    kind: ClassResourceKind;
    noteBody?: string;
    externalUrl?: string;
    file?: File | null;
  }) => Promise<void>;
  openDirectConversation: (classId: string, otherUserId: string) => Promise<string>;
  sendDirectMessage: (conversationId: string, body: string) => Promise<void>;
  receiveDirectMessage: (conversationId: string, message: DirectConversationMessage) => void;
  receiveClassMessage: (classId: string, message: ClassMessage) => void;
  setLessonRecording: (classId: string, lessonId: string, recordingUrl: string) => void;
  setLessonAiRecap: (classId: string, lessonId: string, recap: string) => void;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
  updateStudentNote: (studentId: string, note: string) => Promise<void>;
  undoLastAction: () => void;
  clearUndo: () => void;
}

type TeacherHubStore = TeacherHubState & TeacherHubActions;

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
};

type ClassRow = {
  id: string;
  owner_user_id: string;
  name: string;
  overview: string;
  invite_code: string;
  archived_at: string | null;
};

type ClassMemberRow = {
  class_id: string;
  user_id: string;
  member_role: 'teacher' | 'student';
};

type StudentInsightRow = {
  user_id: string;
  progress: number;
  homework_completion: number;
  note: string;
  needs_attention: boolean;
  last_activity_at: string | null;
};

type LessonRow = {
  id: string;
  class_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  state: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recording_url?: string | null;
  ai_recap?: string | null;
};

type AssignmentRow = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  resources: unknown;
  due_at: string;
  completion_rate: number;
  submissions_pending_review: number;
  assigned_to: 'class' | 'individuals';
};

type AssignmentRecipientRow = {
  assignment_id: string;
  student_user_id: string;
};

type AssignmentSubmissionRow = {
  id: string;
  assignment_id: string;
  class_id: string;
  student_user_id: string;
  submission_note: string | null;
  file_path: string | null;
  submitted_at: string;
  status: 'submitted' | 'graded';
  grade_score: number | null;
  feedback: string | null;
  graded_at: string | null;
};

type ClassResourceRow = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  kind: ClassResourceKind;
  note_body: string | null;
  file_path: string | null;
  external_url: string | null;
  created_at: string;
  created_by_user_id: string;
};

type TopicRow = {
  id: string;
  class_id: string;
  topic: string;
  mastery: number;
  tone: 'strong' | 'steady' | 'attention';
  note: string;
};

type MessageRow = {
  id: string;
  class_id: string;
  sender_display_name: string;
  role: 'teacher' | 'student' | 'system';
  body: string;
  sent_at: string;
};

type DirectConversationRow = {
  id: string;
  class_id: string;
  participant_one_user_id: string;
  participant_two_user_id: string;
  last_message_preview: string;
  last_message_at: string | null;
};

type DirectMessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_display_name: string;
  body: string;
  sent_at: string;
};

type ActivityRow = {
  id: string;
  class_id: string;
  title: string;
  detail: string;
  created_at: string;
};

type LessonPurchaseRow = {
  id: string;
  lesson_id: string;
  student_user_id: string;
  amount_gbp: number;
  status: string;
  created_at: string;
};

const accentOptions = [
  'from-sky-500/20 via-blue-500/10 to-white',
  'from-emerald-500/20 via-green-500/10 to-white',
  'from-amber-500/20 via-orange-500/10 to-white',
  'from-fuchsia-500/20 via-pink-500/10 to-white',
];

const randomId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const generateInviteCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    code = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  } else {
    code = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  return `CLS-${code}`;
};

const generateShortToken = (prefix: string) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  } else {
    token = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  return `${prefix}-${token}`;
};

const inferResourceKindFromFile = (file: File): ClassResourceKind => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/.test(name)) return 'video';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'document';
};

const undoTimers = new Map<string, number>();
const UNDO_WINDOW_MS = 8_000;

const clearUndoTimer = (id: string) => {
  const timer = undoTimers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    undoTimers.delete(id);
  }
};

const getCurrentUser = () => useAuthStore.getState().user;
const isDemoUser = (user: ReturnType<typeof getCurrentUser>) =>
  Boolean(user?.id.startsWith('demo-') || user?.email.endsWith('@skillstream.demo'));

const buildDemoWorkspace = (_user: NonNullable<ReturnType<typeof getCurrentUser>>): {
  classes: TeacherClass[];
  directConversations: DirectConversationSummary[];
  students: StudentSummary[];
  tasks: TeacherTask[];
} => {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

  const demoStudents: StudentSummary[] = [
    {
      id: 'demo-student',
      name: 'Demo Student',
      email: 'student@skillstream.demo',
      progress: 72,
      lastActivity: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      homeworkCompletion: 68,
      classes: ['Algebra Focus Group'],
      note: 'Needs support with word problems.',
      needsAttention: true,
    },
    {
      id: 'demo-learner-2',
      name: 'Ava Thompson',
      email: 'ava.thompson@example.com',
      progress: 84,
      lastActivity: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      homeworkCompletion: 91,
      classes: ['Algebra Focus Group'],
      note: 'Strong consistency this week.',
      needsAttention: false,
    },
  ];

  const baseClass: TeacherClass = {
    id: 'demo-class-1',
    name: 'Algebra Focus Group',
    overview: 'Extra lessons for tricky algebra topics.',
    accent: accentOptions[0],
    studentCount: 2,
    nextSessionAt: inTwoHours,
    inviteCode: 'CLS-DEMO101',
    inviteLink: `${window.location.origin}/invite/CLS-DEMO101`,
    teachers: [
      {
        id: 'demo-teacher',
        name: 'Demo Teacher',
        email: 'teacher@skillstream.demo',
      },
    ],
    students: demoStudents,
    lessons: [
      {
        id: 'demo-lesson-1',
        title: 'Solving Quadratics Fast',
        classId: 'demo-class-1',
        className: 'Algebra Focus Group',
        scheduledAt: inTwoHours,
        durationMinutes: 60,
        state: 'scheduled',
        status: normalizeLessonStatus(inTwoHours, 'scheduled'),
        studentCount: 2,
        syncStatus: 'synced',
      },
      {
        id: 'demo-lesson-2',
        title: 'Exam Drill: Factorization',
        classId: 'demo-class-1',
        className: 'Algebra Focus Group',
        scheduledAt: inTwoDays,
        durationMinutes: 60,
        state: 'scheduled',
        status: normalizeLessonStatus(inTwoDays, 'scheduled'),
        studentCount: 2,
        syncStatus: 'synced',
      },
    ],
    assignments: [
      {
        id: 'demo-assignment-1',
        title: 'Quadratic review sheet',
        description: 'Complete questions 1-12 and upload your working.',
        resources: [{ title: 'Worksheet PDF', url: '#' }],
        dueAt: inFourDays,
        completionRate: 63,
        submissionsPendingReview: 1,
        assignedTo: 'class',
        submissions: [
          {
            id: 'demo-submission-1',
            assignmentId: 'demo-assignment-1',
            studentId: 'demo-student',
            studentName: 'Demo Student',
            submissionNote: 'Uploaded my answers, not sure about question 8.',
            fileUrl: '#',
            submittedAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
            status: 'submitted',
            gradeScore: null,
            feedback: '',
            gradedAt: null,
          },
        ],
        mySubmission: _user.role === 'STUDENT'
          ? {
            id: 'demo-submission-1',
            assignmentId: 'demo-assignment-1',
            studentId: 'demo-student',
            studentName: 'Demo Student',
            submissionNote: 'Uploaded my answers, not sure about question 8.',
            fileUrl: '#',
            submittedAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
            status: 'submitted',
            gradeScore: null,
            feedback: '',
            gradedAt: null,
          }
          : undefined,
      },
    ],
    resources: [
      {
        id: 'demo-resource-1',
        title: 'Lesson recap notes',
        description: 'Quick summary from the previous live class.',
        kind: 'note',
        noteBody: 'Focus on discriminant checks before expanding. Practice set B is due next week.',
        fileUrl: '',
        externalUrl: '',
        createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        createdByName: 'Demo Teacher',
      },
      {
        id: 'demo-resource-2',
        title: 'Quadratics worksheet (PDF)',
        description: 'Independent revision sheet.',
        kind: 'pdf',
        noteBody: '',
        fileUrl: '#',
        externalUrl: '',
        createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        createdByName: 'Demo Teacher',
      },
    ],
    topics: [
      { topic: 'Quadratics', mastery: 62, tone: 'attention', note: 'Revisit completing the square.' },
      { topic: 'Factorization', mastery: 78, tone: 'steady', note: 'Good baseline.' },
      { topic: 'Word problems', mastery: 58, tone: 'attention', note: 'Needs guided walkthroughs.' },
    ],
    messages: [
      {
        id: 'demo-msg-1',
        sender: 'Demo Teacher',
        role: 'teacher',
        body: 'Great work this week everyone — remember to review your factorisation notes before Tuesday\'s session.',
        sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        syncStatus: 'synced',
      },
    ],
    activity: [
      {
        id: 'demo-activity-1',
        title: 'Lesson scheduled',
        detail: 'Solving Quadratics Fast is set for today.',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  const classes = [baseClass];
  const teacherConversation: DirectConversationSummary = {
    id: 'demo-conv-1',
    classId: baseClass.id,
    className: baseClass.name,
    participantUserId: _user.role === 'TEACHER' ? 'demo-student' : 'demo-teacher',
    participantName: _user.role === 'TEACHER' ? 'Demo Student' : 'Demo Teacher',
    participantEmail: _user.role === 'TEACHER' ? 'student@skillstream.demo' : 'teacher@skillstream.demo',
    lastMessagePreview: 'Can we go over question 4 before the live class?',
    lastMessageAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'demo-dm-1',
        conversationId: 'demo-conv-1',
        senderUserId: _user.role === 'TEACHER' ? 'demo-student' : 'demo-teacher',
        senderName: _user.role === 'TEACHER' ? 'Demo Student' : 'Demo Teacher',
        body: 'Can we go over question 4 before the live class?',
        sentAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        syncStatus: 'synced',
      },
    ],
  };

  const tasks = buildTeacherTasks({
    pendingAssignmentReviews: baseClass.assignments.reduce((sum, item) => sum + item.submissionsPendingReview, 0),
    pendingMessages: baseClass.messages.filter((message) => message.role === 'student').length,
    overdueStudentCount: demoStudents.filter((student) => student.needsAttention).length,
  });

  return {
    classes,
    directConversations: [teacherConversation],
    students: demoStudents,
    tasks,
  };
};

const toStudentSummary = (
  profile: ProfileRow,
  insight: StudentInsightRow | undefined,
  classNames: string[]
): StudentSummary => ({
  id: profile.id,
  name: profile.full_name || profile.email.split('@')[0],
  email: profile.email,
  progress: insight?.progress ?? 0,
  lastActivity: insight?.last_activity_at || new Date().toISOString(),
  homeworkCompletion: insight?.homework_completion ?? 0,
  classes: classNames,
  note: insight?.note || 'No notes yet.',
  needsAttention: insight?.needs_attention || false,
});

const buildHubData = (input: {
  currentUserId: string;
  currentUserRole: 'TEACHER' | 'STUDENT' | 'ADMIN';
  classesRows: ClassRow[];
  memberRows: ClassMemberRow[];
  profileRows: ProfileRow[];
  insightRows: StudentInsightRow[];
  lessonRows: LessonRow[];
  assignmentRows: AssignmentRow[];
  assignmentRecipientRows: AssignmentRecipientRow[];
  assignmentSubmissionRows: AssignmentSubmissionRow[];
  assignmentSubmissionUrlByPath: Map<string, string>;
  classResourceRows: ClassResourceRow[];
  classResourceUrlByPath: Map<string, string>;
  topicRows: TopicRow[];
  messageRows: MessageRow[];
  directConversationRows: DirectConversationRow[];
  directMessageRows: DirectMessageRow[];
  activityRows: ActivityRow[];
}): {
  classes: TeacherClass[];
  directConversations: DirectConversationSummary[];
  students: StudentSummary[];
  tasks: TeacherTask[];
} => {
  const profileById = new Map(input.profileRows.map((row) => [row.id, row]));
  const insightsByUserId = new Map(input.insightRows.map((row) => [row.user_id, row]));
  const classNamesByStudentId = new Map<string, string[]>();
  const memberRowsByClassId = new Map<string, ClassMemberRow[]>();

  input.memberRows.forEach((row) => {
    if (!memberRowsByClassId.has(row.class_id)) {
      memberRowsByClassId.set(row.class_id, []);
    }
    memberRowsByClassId.get(row.class_id)?.push(row);
  });

  input.classesRows.forEach((classRow) => {
    const classMembers = memberRowsByClassId.get(classRow.id) || [];
    classMembers
      .filter((member) => member.member_role === 'student')
      .forEach((studentMember) => {
        const existing = classNamesByStudentId.get(studentMember.user_id) || [];
        classNamesByStudentId.set(studentMember.user_id, [...existing, classRow.name]);
      });
  });

  const studentProfiles = input.profileRows.filter((row) => classNamesByStudentId.has(row.id));
  const students = studentProfiles.map((profile) =>
    toStudentSummary(profile, insightsByUserId.get(profile.id), classNamesByStudentId.get(profile.id) || [])
  );
  const studentById = new Map(students.map((student) => [student.id, student]));
  const assignmentSubmissionsByAssignmentId = new Map<string, AssignmentSummary['submissions']>();
  input.assignmentSubmissionRows.forEach((row) => {
    if (!assignmentSubmissionsByAssignmentId.has(row.assignment_id)) assignmentSubmissionsByAssignmentId.set(row.assignment_id, []);
    const student = studentById.get(row.student_user_id);
    const profile = profileById.get(row.student_user_id);
    assignmentSubmissionsByAssignmentId.get(row.assignment_id)?.push({
      id: row.id,
      assignmentId: row.assignment_id,
      studentId: row.student_user_id,
      studentName: student?.name || profile?.full_name || profile?.email.split('@')[0] || 'Student',
      submissionNote: row.submission_note || '',
      fileUrl: row.file_path ? (input.assignmentSubmissionUrlByPath.get(row.file_path) || '') : '',
      submittedAt: row.submitted_at,
      status: row.status,
      gradeScore: row.grade_score,
      feedback: row.feedback || '',
      gradedAt: row.graded_at,
    });
  });

  const assignmentRecipientStudentIdsByAssignmentId = new Map<string, string[]>();
  input.assignmentRecipientRows.forEach((row) => {
    if (!assignmentRecipientStudentIdsByAssignmentId.has(row.assignment_id)) assignmentRecipientStudentIdsByAssignmentId.set(row.assignment_id, []);
    assignmentRecipientStudentIdsByAssignmentId.get(row.assignment_id)?.push(row.student_user_id);
  });

  const lessonsByClassId = new Map<string, LessonSummary[]>();
  input.lessonRows.forEach((row) => {
    if (!lessonsByClassId.has(row.class_id)) lessonsByClassId.set(row.class_id, []);
    const lesson: LessonSummary = {
      id: row.id,
      title: row.title,
      classId: row.class_id,
      className: '',
      scheduledAt: row.scheduled_at,
      durationMinutes: row.duration_minutes,
      state: row.state,
      status: normalizeLessonStatus(row.scheduled_at, row.state),
      studentCount: 0,
      syncStatus: 'synced',
      recordingUrl: row.recording_url || undefined,
      aiRecap: row.ai_recap || undefined,
    };
    lessonsByClassId.get(row.class_id)?.push(lesson);
  });

  const assignmentsByClassId = new Map<string, AssignmentSummary[]>();
  input.assignmentRows.forEach((row) => {
    if (!assignmentsByClassId.has(row.class_id)) assignmentsByClassId.set(row.class_id, []);
    const resources = Array.isArray(row.resources)
      ? (row.resources as Array<{ title?: unknown; url?: unknown }>)
          .map((entry) => ({
            title: typeof entry.title === 'string' ? entry.title : 'Resource',
            url: typeof entry.url === 'string' ? entry.url : '',
          }))
          .filter((entry) => entry.url.trim().length > 0)
      : [];

    const assignedStudentIds = assignmentRecipientStudentIdsByAssignmentId.get(row.id) || [];
    const submissions = (assignmentSubmissionsByAssignmentId.get(row.id) || [])
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    assignmentsByClassId.get(row.class_id)?.push({
      id: row.id,
      title: row.title,
      description: row.description || '',
      resources,
      dueAt: row.due_at,
      completionRate: row.completion_rate,
      submissionsPendingReview: row.submissions_pending_review,
      assignedTo: row.assigned_to,
      assignedStudentIds,
      submissions,
      mySubmission: submissions.find((entry) => entry.studentId === input.currentUserId),
    });
  });

  const topicsByClassId = new Map<string, TopicInsight[]>();
  input.topicRows.forEach((row) => {
    if (!topicsByClassId.has(row.class_id)) topicsByClassId.set(row.class_id, []);
    topicsByClassId.get(row.class_id)?.push({
      topic: row.topic,
      mastery: row.mastery,
      tone: row.tone,
      note: row.note,
    });
  });

  const classResourcesByClassId = new Map<string, ClassResourceSummary[]>();
  input.classResourceRows.forEach((row) => {
    if (!classResourcesByClassId.has(row.class_id)) classResourcesByClassId.set(row.class_id, []);
    const authorProfile = profileById.get(row.created_by_user_id);
    classResourcesByClassId.get(row.class_id)?.push({
      id: row.id,
      title: row.title,
      description: row.description || '',
      kind: row.kind,
      noteBody: row.note_body || '',
      fileUrl: row.file_path ? (input.classResourceUrlByPath.get(row.file_path) || '') : '',
      externalUrl: row.external_url || '',
      createdAt: row.created_at,
      createdByName: authorProfile?.full_name || authorProfile?.email.split('@')[0] || 'Teacher',
    });
  });

  const messagesByClassId = new Map<string, ClassMessage[]>();
  input.messageRows.forEach((row) => {
    if (!messagesByClassId.has(row.class_id)) messagesByClassId.set(row.class_id, []);
    messagesByClassId.get(row.class_id)?.push({
      id: row.id,
      sender: row.sender_display_name,
      role: row.role,
      body: row.body,
      sentAt: row.sent_at,
      syncStatus: 'synced',
    });
  });

  const activityByClassId = new Map<string, ActivityRow[]>();
  input.activityRows.forEach((row) => {
    if (!activityByClassId.has(row.class_id)) activityByClassId.set(row.class_id, []);
    activityByClassId.get(row.class_id)?.push(row);
  });

  const classes = input.classesRows.map((row, index) => {
    const classMembers = memberRowsByClassId.get(row.id) || [];
    const classStudents = classMembers
      .filter((member) => member.member_role === 'student')
      .map((member) => studentById.get(member.user_id))
      .filter((value): value is StudentSummary => Boolean(value));
    const classTeachers = classMembers
      .filter((member) => member.member_role === 'teacher')
      .map((member) => profileById.get(member.user_id))
      .filter((value): value is ProfileRow => Boolean(value))
      .map((profile) => ({
        id: profile.id,
        name: profile.full_name || profile.email.split('@')[0],
        email: profile.email,
      }));

    const lessons = (lessonsByClassId.get(row.id) || [])
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map((lesson) => ({ ...lesson, className: row.name, studentCount: classStudents.length }));
    const nextUpcoming = lessons.find((lesson) => lesson.status !== 'completed' && lesson.status !== 'cancelled');

    const assignments = (assignmentsByClassId.get(row.id) || [])
      .filter((assignment) => (
        input.currentUserId
          ? assignment.assignedTo === 'class'
            || input.currentUserRole !== 'STUDENT'
            || (assignment.assignedStudentIds || []).includes(input.currentUserId)
          : true
      ))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    return {
      id: row.id,
      name: row.name,
      overview: row.overview,
      accent: accentOptions[index % accentOptions.length],
      studentCount: classStudents.length,
      nextSessionAt: nextUpcoming?.scheduledAt || lessons[lessons.length - 1]?.scheduledAt || new Date().toISOString(),
      inviteCode: row.invite_code,
      inviteLink: `${window.location.origin}/invite/${row.invite_code}`,
      teachers: classTeachers,
      students: classStudents,
      lessons,
      assignments,
      resources: (classResourcesByClassId.get(row.id) || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      topics: topicsByClassId.get(row.id) || [],
      messages: (messagesByClassId.get(row.id) || []).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
      activity: (activityByClassId.get(row.id) || []).map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        timestamp: item.created_at,
      })),
    } satisfies TeacherClass;
  });

  const classById = new Map(classes.map((entry) => [entry.id, entry]));
  const directMessagesByConversationId = new Map<string, DirectConversationSummary['messages']>();
  input.directMessageRows.forEach((row) => {
    if (!directMessagesByConversationId.has(row.conversation_id)) {
      directMessagesByConversationId.set(row.conversation_id, []);
    }
    directMessagesByConversationId.get(row.conversation_id)?.push({
      id: row.id,
      conversationId: row.conversation_id,
      senderUserId: row.sender_user_id,
      senderName: row.sender_display_name,
      body: row.body,
      sentAt: row.sent_at,
      syncStatus: 'synced',
    });
  });

  const directConversations = input.directConversationRows
    .map((row) => {
      const isParticipantOne = row.participant_one_user_id === input.currentUserId;
      const otherUserId = isParticipantOne ? row.participant_two_user_id : row.participant_one_user_id;
      const otherProfile = profileById.get(otherUserId);
      const className = classById.get(row.class_id)?.name || 'Class';
      return {
        id: row.id,
        classId: row.class_id,
        className,
        participantUserId: otherUserId,
        participantName: otherProfile?.full_name || otherProfile?.email.split('@')[0] || 'Participant',
        participantEmail: otherProfile?.email || '',
        lastMessagePreview: row.last_message_preview || '',
        lastMessageAt: row.last_message_at,
        messages: (directMessagesByConversationId.get(row.id) || [])
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
      } satisfies DirectConversationSummary;
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

  const pendingAssignmentReviews = classes.flatMap((entry) => entry.assignments).reduce((sum, entry) => sum + entry.submissionsPendingReview, 0);
  const pendingMessages = classes.flatMap((entry) => entry.messages).filter((entry) => entry.role === 'student').length;
  const overdueStudentCount = students.filter((entry) => entry.needsAttention).length;
  const nextReviewDueAt = classes
    .flatMap((entry) => entry.assignments)
    .filter((assignment) => assignment.submissionsPendingReview > 0)
    .map((assignment) => assignment.dueAt)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const latestStudentMessageAt = classes
    .flatMap((entry) => entry.messages)
    .filter((entry) => entry.role === 'student')
    .map((entry) => entry.sentAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const nextMessageDueAt = latestStudentMessageAt
    ? new Date(new Date(latestStudentMessageAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const nextSupportDueAt = classes
    .flatMap((entry) => entry.students)
    .filter((entry) => entry.needsAttention)
    .map((entry) => entry.lastActivity)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const tasks = buildTeacherTasks({
    pendingAssignmentReviews,
    nextReviewDueAt,
    pendingMessages,
    nextMessageDueAt,
    overdueStudentCount,
    nextSupportDueAt,
  });

  return { classes, directConversations, students, tasks };
};

export const useTeacherHubStore = create<TeacherHubStore>((set, get) => ({
  classes: [],
  directConversations: [],
  students: [],
  payments: [],
  tasks: [],
  revision: 0,
  isHydrated: false,
  isSyncing: false,
  error: null,
  undoItem: null,

  loadWorkspace: async () => {
    const user = getCurrentUser();
    if (!user) {
      set({
        classes: [],
        directConversations: [],
        students: [],
        tasks: [],
        payments: [],
        isHydrated: true,
        isSyncing: false,
        error: null,
      });
      return;
    }

    if (isDemoUser(user)) {
      const existing = get();
      if (existing.classes.length > 0 && existing.students.length > 0) {
        set((state) => ({
          isHydrated: true,
          isSyncing: false,
          error: null,
          revision: state.revision + 1,
        }));
        return;
      }
      const demo = buildDemoWorkspace(user);
      set((state) => ({
        classes: demo.classes,
        directConversations: demo.directConversations,
        students: demo.students,
        tasks: user.role === 'TEACHER' ? demo.tasks : [],
        payments: [],
        isHydrated: true,
        isSyncing: false,
        error: null,
        revision: state.revision + 1,
      }));
      return;
    }

    if (!hasSupabaseConfig) {
      set({
        classes: [],
        directConversations: [],
        students: [],
        tasks: [],
        payments: [],
        isHydrated: true,
        isSyncing: false,
        error: 'Supabase is not configured.',
      });
      return;
    }

    set({ isSyncing: true, error: null });
    try {
      let classIds: string[] = [];
      if (user.role === 'ADMIN') {
        const { data: allClasses } = await supabase.from('classes').select('id').is('archived_at', null);
        classIds = (allClasses || []).map((row) => row.id as string);
      } else {
        const memberRole = user.role === 'TEACHER' ? 'teacher' : 'student';
        const { data: memberRows, error: memberError } = await supabase
          .from('class_members')
          .select('class_id')
          .eq('user_id', user.id)
          .eq('member_role', memberRole);

        if (memberError) throw memberError;
        classIds = (memberRows || []).map((row) => row.class_id as string);
      }

      if (classIds.length === 0) {
        set({
          classes: [],
          directConversations: [],
          students: [],
          tasks: [],
          payments: [],
          isHydrated: true,
          isSyncing: false,
          error: null,
          revision: get().revision + 1,
        });
        return;
      }

      const [
        classesRes,
        membersRes,
        lessonsRes,
        assignmentsRes,
        assignmentRecipientsRes,
        assignmentSubmissionsRes,
        classResourcesRes,
        topicsRes,
        messagesRes,
        directConversationsRes,
        activityRes,
      ] = await Promise.all([
        supabase.from('classes').select('id, owner_user_id, name, overview, invite_code, archived_at').in('id', classIds).is('archived_at', null),
        supabase.from('class_members').select('class_id, user_id, member_role').in('class_id', classIds),
        supabase.from('lessons').select('id, class_id, title, scheduled_at, duration_minutes, state, recording_url, ai_recap').in('class_id', classIds),
        supabase
          .from('class_assignments')
          .select('id, class_id, title, description, resources, due_at, completion_rate, submissions_pending_review, assigned_to')
          .in('class_id', classIds),
        supabase
          .from('assignment_recipients')
          .select('assignment_id, student_user_id')
          .in('class_id', classIds),
        supabase
          .from('assignment_submissions')
          .select('id, assignment_id, class_id, student_user_id, submission_note, file_path, submitted_at, status, grade_score, feedback, graded_at')
          .in('class_id', classIds),
        supabase
          .from('class_resources')
          .select('id, class_id, title, description, kind, note_body, file_path, external_url, created_at, created_by_user_id')
          .in('class_id', classIds),
        supabase.from('class_topic_insights').select('id, class_id, topic, mastery, tone, note').in('class_id', classIds),
        supabase.from('class_messages').select('id, class_id, sender_display_name, role, body, sent_at').in('class_id', classIds),
        supabase
          .from('direct_conversations')
          .select('id, class_id, participant_one_user_id, participant_two_user_id, last_message_preview, last_message_at')
          .or(`participant_one_user_id.eq.${user.id},participant_two_user_id.eq.${user.id}`)
          .in('class_id', classIds),
        supabase.from('class_activity_events').select('id, class_id, title, detail, created_at').in('class_id', classIds),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (membersRes.error) throw membersRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (assignmentRecipientsRes.error) throw assignmentRecipientsRes.error;
      if (assignmentSubmissionsRes.error) throw assignmentSubmissionsRes.error;
      if (classResourcesRes.error) throw classResourcesRes.error;
      if (topicsRes.error) throw topicsRes.error;
      if (messagesRes.error) throw messagesRes.error;
      if (directConversationsRes.error) throw directConversationsRes.error;
      if (activityRes.error) throw activityRes.error;

      const memberRows = (membersRes.data || []) as ClassMemberRow[];
      const memberUserIds = Array.from(new Set(memberRows.map((row) => row.user_id)));
      const assignmentSubmissionRows = (assignmentSubmissionsRes.data || []) as AssignmentSubmissionRow[];
      const classResourceRows = (classResourcesRes.data || []) as ClassResourceRow[];
      const directConversationRows = (directConversationsRes.data || []) as DirectConversationRow[];
      const directConversationIds = directConversationRows.map((row) => row.id);

      const [profilesRes, insightsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name').in('id', memberUserIds),
        supabase.from('student_insights').select('user_id, progress, homework_completion, note, needs_attention, last_activity_at').in('user_id', memberUserIds),
      ]);

      const directMessagesRes = directConversationIds.length > 0
        ? await supabase
          .from('direct_messages')
          .select('id, conversation_id, sender_user_id, sender_display_name, body, sent_at')
          .in('conversation_id', directConversationIds)
        : { data: [], error: null };

      if (profilesRes.error) throw profilesRes.error;
      if (insightsRes.error) throw insightsRes.error;
      if (directMessagesRes.error) throw directMessagesRes.error;

      // Load lesson purchase records so teachers can see student payment history.
      const lessonIds = ((lessonsRes.data || []) as LessonRow[]).map((r) => r.id);
      const purchasesRes = (user.role === 'TEACHER' || user.role === 'ADMIN') && lessonIds.length > 0
        ? await supabase
          .from('lesson_live_purchases')
          .select('id, lesson_id, student_user_id, amount_gbp, status, created_at')
          .in('lesson_id', lessonIds)
        : { data: [] as LessonPurchaseRow[], error: null };

      const assignmentSubmissionUrlByPath = new Map<string, string>();
      const assignmentSubmissionFilePaths = Array.from(new Set(
        assignmentSubmissionRows.map((row) => row.file_path).filter((value): value is string => Boolean(value))
      ));
      if (assignmentSubmissionFilePaths.length > 0) {
        await Promise.all(assignmentSubmissionFilePaths.map(async (path) => {
          const { data } = await supabase.storage.from('assignment-submissions').createSignedUrl(path, 60 * 60);
          if (data?.signedUrl) {
            assignmentSubmissionUrlByPath.set(path, data.signedUrl);
          }
        }));
      }

      const classResourceUrlByPath = new Map<string, string>();
      const filePaths = Array.from(new Set(classResourceRows.map((row) => row.file_path).filter((value): value is string => Boolean(value))));
      if (filePaths.length > 0) {
        await Promise.all(filePaths.map(async (path) => {
          const { data } = await supabase.storage.from('class-resources').createSignedUrl(path, 60 * 60);
          if (data?.signedUrl) {
            classResourceUrlByPath.set(path, data.signedUrl);
          }
        }));
      }

      const hubData = buildHubData({
        currentUserId: user.id,
        currentUserRole: user.role,
        classesRows: (classesRes.data || []) as ClassRow[],
        memberRows,
        profileRows: (profilesRes.data || []) as ProfileRow[],
        insightRows: (insightsRes.data || []) as StudentInsightRow[],
        lessonRows: (lessonsRes.data || []) as LessonRow[],
        assignmentRows: (assignmentsRes.data || []) as AssignmentRow[],
        assignmentRecipientRows: (assignmentRecipientsRes.data || []) as AssignmentRecipientRow[],
        assignmentSubmissionRows,
        assignmentSubmissionUrlByPath,
        classResourceRows,
        classResourceUrlByPath,
        topicRows: (topicsRes.data || []) as TopicRow[],
        messageRows: (messagesRes.data || []) as MessageRow[],
        directConversationRows,
        directMessageRows: (directMessagesRes.data || []) as DirectMessageRow[],
        activityRows: (activityRes.data || []) as ActivityRow[],
      });

      // Build the profile lookup and class-name lookup for mapping purchases.
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id as string, p.full_name as string]));
      const lessonClassMap = new Map(
        ((lessonsRes.data || []) as LessonRow[]).map((l) => [
          l.id,
          (classesRes.data || []).find((c) => (c as ClassRow).id === l.class_id) as ClassRow | undefined,
        ])
      );
      const payments: PaymentRecord[] = ((purchasesRes.data || []) as LessonPurchaseRow[]).map((row) => {
        const cls = lessonClassMap.get(row.lesson_id);
        const rawStatus = row.status;
        const status: PaymentStatus = rawStatus === 'paid' ? 'paid' : rawStatus === 'overdue' ? 'overdue' : 'pending';
        return {
          id: row.id,
          studentId: row.student_user_id,
          studentName: profileMap.get(row.student_user_id) || 'Unknown',
          className: cls?.name || 'Unknown class',
          amount: Number(row.amount_gbp),
          dueAt: row.created_at,
          status,
        };
      });

      set((state) => ({
        classes: hubData.classes,
        directConversations: hubData.directConversations,
        students: hubData.students,
        tasks: hubData.tasks,
        payments,
        isHydrated: true,
        isSyncing: false,
        error: null,
        revision: state.revision + 1,
      }));
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Could not load workspace data.';
      set({ isSyncing: false, isHydrated: true, error: message });
    }
  },

  createClass: async ({ name, overview }) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'TEACHER') {
        const message = 'Only teachers can create classes.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const nowIso = new Date().toISOString();
        const classId = randomId('class');
        const inviteCode = generateInviteCode();
        const demoClass: TeacherClass = {
          id: classId,
          name,
          overview,
          accent: accentOptions[get().classes.length % accentOptions.length],
          studentCount: 0,
          nextSessionAt: nowIso,
          inviteCode,
          inviteLink: `${window.location.origin}/invite/${inviteCode}`,
          teachers: [{ id: user.id, name: user.name || user.email, email: user.email }],
          students: [],
          lessons: [],
          assignments: [],
          resources: [],
          topics: [
            { topic: 'Core concepts', mastery: 0, tone: 'steady', note: 'No assessment data yet.' },
            { topic: 'Exam practice', mastery: 0, tone: 'steady', note: 'No assessment data yet.' },
          ],
          messages: [],
          activity: [
            {
              id: randomId('activity'),
              title: 'Class created',
              detail: 'New class workspace created in demo mode.',
              timestamp: nowIso,
            },
          ],
        };

        set((state) => ({
          classes: [demoClass, ...state.classes],
          revision: state.revision + 1,
          error: null,
          isHydrated: true,
          isSyncing: false,
        }));
        return;
      }

      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('classes')
        .insert({
          owner_user_id: user.id,
          name,
          overview,
          invite_code: inviteCode,
        })
        .select('id')
        .single();
      if (error || !data) {
        const message = error?.message || 'Could not create class. Please try again.';
        set({
          error: message,
        });
        throw new Error(message);
      }

      const { error: memberError } = await supabase.from('class_members').upsert({
        class_id: data.id,
        user_id: user.id,
        member_role: 'teacher',
      });
      if (memberError) {
        set({ error: memberError.message });
        throw new Error(memberError.message);
      }

      const { error: activityError } = await supabase.from('class_activity_events').insert({
        class_id: data.id,
        title: 'Class created',
        detail: 'New class workspace created.',
        actor_user_id: user.id,
      });
      if (activityError) {
        set({ error: activityError.message });
        throw new Error(activityError.message);
      }

      const { error: topicError } = await supabase.from('class_topic_insights').insert([
        { class_id: data.id, topic: 'Core concepts', mastery: 0, tone: 'steady', note: 'No assessment data yet.' },
        { class_id: data.id, topic: 'Exam practice', mastery: 0, tone: 'steady', note: 'No assessment data yet.' },
      ]);
      if (topicError) {
        set({ error: topicError.message });
        throw new Error(topicError.message);
      }
      trackAnalyticsEvent({
        eventType: 'class_created',
        classId: data.id,
      });

      await get().loadWorkspace();
  },

  updateClassDetails: async (classId, { name, overview }) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'TEACHER') {
        const message = 'Only teachers can edit classes.';
        set({ error: message });
        throw new Error(message);
      }
      const trimmedName = name.trim();
      const trimmedOverview = overview.trim();
      if (!trimmedName || !trimmedOverview) {
        const message = 'Class name and description are required.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => ({
          classes: state.classes.map((entry) => (
            entry.id === classId
              ? { ...entry, name: trimmedName, overview: trimmedOverview }
              : entry
          )),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('classes')
        .update({
          name: trimmedName,
          overview: trimmedOverview,
        })
        .eq('id', classId)
        .is('archived_at', null);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      await get().loadWorkspace();
  },

  archiveClass: async (classId) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'TEACHER') {
        const message = 'Only teachers can archive classes.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => ({
          classes: state.classes.filter((entry) => entry.id !== classId),
          directConversations: state.directConversations.filter((entry) => entry.classId !== classId),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('classes')
        .update({
          archived_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .is('archived_at', null);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      await get().loadWorkspace();
  },

  refreshInvite: async (classId: string) => {
      const targetClass = get().classes.find((entry) => entry.id === classId);
      if (!targetClass) {
        const message = 'Class not found.';
        set({ error: message });
        throw new Error(message);
      }
      const user = getCurrentUser();
      if (user && isDemoUser(user)) {
        const nextCode = generateInviteCode();
        set((state) => ({
          classes: state.classes.map((entry) => (
            entry.id === classId
              ? {
                ...entry,
                inviteCode: nextCode,
                inviteLink: `${window.location.origin}/invite/${nextCode}`,
              }
              : entry
          )),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }
      const { error } = await supabase.from('classes').update({ invite_code: generateInviteCode() }).eq('id', classId);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }
      await get().loadWorkspace();
  },

  addStudentToClass: async (classId, studentId) => {
      const user = getCurrentUser();
      if (user && isDemoUser(user)) {
        set((state) => {
          const student = state.students.find((entry) => entry.id === studentId);
          if (!student) return state;
          return {
            classes: state.classes.map((entry) => {
              if (entry.id !== classId) return entry;
              if (entry.students.some((existing) => existing.id === student.id)) return entry;
              return {
                ...entry,
                students: [...entry.students, student],
                studentCount: entry.studentCount + 1,
                activity: [
                  {
                    id: randomId('activity'),
                    title: 'Student added',
                    detail: `${student.name} joined the class.`,
                    timestamp: new Date().toISOString(),
                  },
                  ...entry.activity,
                ],
              };
            }),
            revision: state.revision + 1,
            error: null,
          };
        });
        return;
      }
      const { error } = await supabase.from('class_members').upsert({ class_id: classId, user_id: studentId, member_role: 'student' });
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }
      trackAnalyticsEvent({
        eventType: 'class_member_added',
        classId,
        metadata: { studentId },
      });
      await get().loadWorkspace();
  },

  inviteStudentByEmail: async (classId, email) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Student email is required.');
    }

    const user = getCurrentUser();
    if (!user) throw new Error('You must be signed in.');

    if (isDemoUser(user)) {
      const demoStudentId = randomId('student');
      const demoStudent: StudentSummary = {
        id: demoStudentId,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        progress: 0,
        lastActivity: new Date().toISOString(),
        homeworkCompletion: 0,
        classes: [],
        note: 'Invited learner',
        needsAttention: false,
      };

      set((state) => {
        const nextStudents = state.students.some((entry) => entry.email.toLowerCase() === normalizedEmail)
          ? state.students
          : [demoStudent, ...state.students];
        const nextClasses = state.classes.map((entry) => {
          if (entry.id !== classId) return entry;
          const already = entry.students.some((student) => student.email.toLowerCase() === normalizedEmail);
          if (already) return entry;
          const classStudent = nextStudents.find((student) => student.email.toLowerCase() === normalizedEmail) || demoStudent;
          return {
            ...entry,
            students: [...entry.students, classStudent],
            studentCount: entry.students.length + 1,
            activity: [
              {
                id: randomId('activity'),
                title: 'Student invited',
                detail: `Invite created for ${normalizedEmail} (demo mode).`,
                timestamp: new Date().toISOString(),
              },
              ...entry.activity,
            ],
          };
        });
        return {
          students: nextStudents,
          classes: nextClasses,
          revision: state.revision + 1,
          error: null,
        };
      });

      return {
        status: 'invited_new',
        message: 'Invite created in demo mode.',
      };
    }

    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (profileError) {
      throw new Error(profileError.message);
    }

    if (existingProfile && existingProfile.role === 'student') {
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', classId)
        .eq('user_id', existingProfile.id)
        .eq('member_role', 'student')
        .maybeSingle();
      if (existingMember) {
        return {
          status: 'already_member',
          message: 'This student is already in the class.',
        };
      }
      await supabase.from('class_members').upsert({ class_id: classId, user_id: existingProfile.id, member_role: 'student' });
      await get().loadWorkspace();
      return {
        status: 'added_existing',
        message: 'Student added from your workspace.',
      };
    }

    const inviteCode = generateShortToken('INV');
    const inviteLink = `${window.location.origin}/register?role=student&email=${encodeURIComponent(normalizedEmail)}&class=${encodeURIComponent(classId)}&invite=${inviteCode}`;
    const { error: inviteError } = await supabase.from('class_student_invites').insert({
      class_id: classId,
      email: normalizedEmail,
      invite_code: inviteCode,
      invited_by_user_id: user.id,
      status: 'pending',
      invite_link: inviteLink,
    });
    if (inviteError) {
      throw new Error(inviteError.message);
    }

    let inviteEmailDelivered = false;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      const { error: emailError } = await supabase.functions.invoke('class-invite-email', {
          body: {
            classId,
            email: normalizedEmail,
            inviteLink,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        .catch(() => ({ error: new Error('invite email request failed') }));
      inviteEmailDelivered = !emailError;
    }

    await supabase.from('class_activity_events').insert({
      class_id: classId,
      title: 'Student invited',
      detail: `Invite queued for ${normalizedEmail}.`,
      actor_user_id: user.id,
    });
    await get().loadWorkspace();
    return {
      status: 'invited_new',
      message: inviteEmailDelivered
        ? 'Student invite created and email sent.'
        : 'Student invite created. Copy the link and share it with the student.',
    };
  },

  removeStudentFromClass: async (classId, studentId) => {
      const user = getCurrentUser();
      if (user && isDemoUser(user)) {
        set((state) => ({
          classes: state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            const removed = entry.students.find((student) => student.id === studentId);
            const nextStudents = entry.students.filter((student) => student.id !== studentId);
            return {
              ...entry,
              students: nextStudents,
              studentCount: Math.max(0, nextStudents.length),
              activity: removed ? [{
                id: randomId('activity'),
                title: 'Student removed',
                detail: `${removed.name} removed from class.`,
                timestamp: new Date().toISOString(),
              }, ...entry.activity] : entry.activity,
            };
          }),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }
      const { error } = await supabase.from('class_members').delete().eq('class_id', classId).eq('user_id', studentId).eq('member_role', 'student');
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }
      trackAnalyticsEvent({
        eventType: 'class_member_removed',
        classId,
        metadata: { studentId },
      });
      await get().loadWorkspace();
  },

  scheduleLesson: async ({ classId, title, scheduledAt, durationMinutes }) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to schedule a lesson.';
        set({ error: message });
        throw new Error(message);
      }
      const when = new Date(scheduledAt);
      if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) {
        const message = 'Lesson time must be in the future.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => {
          const nextClasses = state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            const demoLesson: LessonSummary = {
              id: randomId('lesson'),
              title,
              classId: entry.id,
              className: entry.name,
              scheduledAt,
              durationMinutes,
              state: 'scheduled',
              status: normalizeLessonStatus(scheduledAt, 'scheduled'),
              studentCount: entry.studentCount,
              syncStatus: 'synced',
            };
            const nextLessons = [demoLesson, ...entry.lessons].sort(
              (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
            );
            const now = Date.now();
            const nextUpcoming = nextLessons.find((lesson) => new Date(lesson.scheduledAt).getTime() >= now);
            return {
              ...entry,
              lessons: nextLessons,
              nextSessionAt: nextUpcoming?.scheduledAt || entry.nextSessionAt,
              activity: [
                {
                  id: randomId('activity'),
                  title: 'Lesson scheduled',
                  detail: `"${title}" added in demo mode.`,
                  timestamp: new Date().toISOString(),
                },
                ...entry.activity,
              ],
            };
          });
          return {
            classes: nextClasses,
            revision: state.revision + 1,
            error: null,
          };
        });
        return;
      }
      const undoId = randomId('undo');
      const expiresAt = Date.now() + UNDO_WINDOW_MS;
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          class_id: classId,
          title,
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          state: 'scheduled',
          created_by_user_id: user.id,
        })
        .select('id')
        .single();
      if (error || !data) {
        const message = error?.message || 'Could not schedule lesson.';
        set({ error: message });
        throw new Error(message);
      }

      const previousUndo = get().undoItem;
      if (previousUndo) clearUndoTimer(previousUndo.id);
      set((state) => ({
        undoItem: {
          id: undoId,
          label: `Lesson "${title}" scheduled`,
          kind: 'lesson',
          classId,
          targetId: data.id,
          expiresAt,
        },
        revision: state.revision + 1,
      }));

      const expiryTimer = window.setTimeout(() => {
        set((state) => {
          if (state.undoItem?.id !== undoId) return state;
          return { undoItem: null };
        });
        undoTimers.delete(undoId);
      }, UNDO_WINDOW_MS);
      undoTimers.set(undoId, expiryTimer);
      trackAnalyticsEvent({
        eventType: 'lesson_scheduled',
        classId,
        lessonId: data.id,
        metadata: {
          durationMinutes,
        },
      });

      await get().loadWorkspace();
  },

  scheduleLessonSeries: async ({ classId, title, firstScheduledAt, durationMinutes, occurrences }) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to schedule lessons.';
        set({ error: message });
        throw new Error(message);
      }
      const safeOccurrences = Math.max(1, Math.min(24, Math.floor(occurrences)));
      const seriesDates = Array.from({ length: safeOccurrences }).map((_, index) => {
        const nextDate = new Date(firstScheduledAt);
        nextDate.setDate(nextDate.getDate() + index * 7);
        return nextDate;
      });
      if (seriesDates.some((date) => !Number.isFinite(date.getTime()) || date.getTime() <= Date.now())) {
        const message = 'All lesson dates in the series must be in the future.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => {
          const nextClasses = state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            const generatedLessons: LessonSummary[] = seriesDates.map((date, index) => ({
              id: randomId('lesson'),
              title: safeOccurrences > 1 ? `${title} (Week ${index + 1})` : title,
              classId: entry.id,
              className: entry.name,
              scheduledAt: date.toISOString(),
              durationMinutes,
              state: 'scheduled',
              status: normalizeLessonStatus(date.toISOString(), 'scheduled'),
              studentCount: entry.studentCount,
              syncStatus: 'synced',
            }));
            const nextLessons = [...generatedLessons, ...entry.lessons].sort(
              (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
            );
            const now = Date.now();
            const nextUpcoming = nextLessons.find((lesson) => new Date(lesson.scheduledAt).getTime() >= now);
            return {
              ...entry,
              lessons: nextLessons,
              nextSessionAt: nextUpcoming?.scheduledAt || entry.nextSessionAt,
              activity: [
                {
                  id: randomId('activity'),
                  title: 'Lesson series scheduled',
                  detail: `${safeOccurrences} weekly lessons added in demo mode.`,
                  timestamp: new Date().toISOString(),
                },
                ...entry.activity,
              ],
            };
          });
          return {
            classes: nextClasses,
            revision: state.revision + 1,
            error: null,
          };
        });
        return;
      }

      const { data, error } = await supabase.rpc('schedule_lesson_series', {
        p_class_id: classId,
        p_title: title,
        p_first_scheduled_at: seriesDates[0].toISOString(),
        p_duration_minutes: durationMinutes,
        p_occurrences: safeOccurrences,
      });
      if (error) {
        const message = error.message || 'Could not schedule lesson series.';
        set({ error: message });
        throw new Error(message);
      }

      trackAnalyticsEvent({
        eventType: 'lesson_scheduled',
        classId,
        lessonId: data?.[0]?.lesson_id,
        metadata: {
          durationMinutes,
          occurrences: safeOccurrences,
          series: true,
        },
      });

      await get().loadWorkspace();
  },

  rescheduleLesson: async (classId, lessonId, scheduledAt) => {
      const when = new Date(scheduledAt);
      if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) {
        const message = 'Rescheduled lesson time must be in the future.';
        set({ error: message });
        throw new Error(message);
      }
      const user = getCurrentUser();
      if (user && isDemoUser(user)) {
        set((state) => {
          const nextClasses = state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            const nextLessons = entry.lessons
              .map((lesson) => (
                lesson.id === lessonId
                  ? {
                    ...lesson,
                    scheduledAt,
                    state: lesson.state === 'cancelled' ? 'scheduled' : lesson.state,
                    status: normalizeLessonStatus(scheduledAt, lesson.state === 'cancelled' ? 'scheduled' : lesson.state),
                    syncStatus: 'synced' as const,
                  }
                  : lesson
              ))
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
            const now = Date.now();
            const nextUpcoming = nextLessons.find((lesson) => new Date(lesson.scheduledAt).getTime() >= now);
            return {
              ...entry,
              lessons: nextLessons,
              nextSessionAt: nextUpcoming?.scheduledAt || entry.nextSessionAt,
              activity: [
                {
                  id: randomId('activity'),
                  title: 'Lesson rescheduled',
                  detail: 'Session time updated in demo mode.',
                  timestamp: new Date().toISOString(),
                },
                ...entry.activity,
              ],
            };
          });
          return {
            classes: nextClasses,
            revision: state.revision + 1,
            error: null,
          };
        });
        return;
      }

      const { error } = await supabase.from('lessons').update({ scheduled_at: scheduledAt, state: 'scheduled' }).eq('id', lessonId).eq('class_id', classId);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }
      trackAnalyticsEvent({
        eventType: 'lesson_rescheduled',
        classId,
        lessonId,
      });
      await get().loadWorkspace();
  },

  cancelLesson: async (classId, lessonId) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to cancel a lesson.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => ({
          classes: state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            const nextLessons = entry.lessons.map((lesson) => (
              lesson.id === lessonId
                ? {
                  ...lesson,
                  state: 'cancelled' as const,
                  status: 'cancelled' as const,
                  syncStatus: 'synced' as const,
                }
                : lesson
            ));
            return {
              ...entry,
              lessons: nextLessons,
            };
          }),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('lessons')
        .update({ state: 'cancelled' })
        .eq('id', lessonId)
        .eq('class_id', classId);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }
      trackAnalyticsEvent({
        eventType: 'lesson_cancelled',
        classId,
        lessonId,
      });
      await get().loadWorkspace();
  },

  createAssignment: async ({ classId, title, description, resources, files = [], dueAt, assignedTo, assignedStudentIds = [] }) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to create assignments.';
        set({ error: message });
        throw new Error(message);
      }
      const dueDate = new Date(dueAt);
      if (!Number.isFinite(dueDate.getTime()) || dueDate.getTime() <= Date.now()) {
        const message = 'Assignment due date must be in the future.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const demoAssignment: AssignmentSummary = {
          id: randomId('assignment'),
          title,
          description,
          resources,
          dueAt,
          completionRate: 0,
          submissionsPendingReview: 0,
          assignedTo,
          assignedStudentIds: assignedTo === 'individuals' ? assignedStudentIds : [],
          submissions: [],
        };
        set((state) => ({
          classes: state.classes.map((entry) =>
            entry.id === classId
              ? { ...entry, assignments: [demoAssignment, ...entry.assignments] }
              : entry
          ),
          revision: state.revision + 1,
        }));
        return;
      }

      const uploadedResources: Array<{ title: string; url: string }> = [];
      for (const file of files) {
        const extension = file.name.includes('.') ? file.name.split('.').pop() : '';
        const safeExtension = extension ? `.${extension.toLowerCase()}` : '';
        const storagePath = `${classId}/${Date.now()}-${randomId('res')}${safeExtension}`;
        const { error: uploadError } = await supabase.storage.from('assignment-resources').upload(storagePath, file, {
          upsert: false,
        });
        if (uploadError) {
          throw new Error(`Could not upload "${file.name}". ${uploadError.message}`);
        }
        const { data: publicData } = supabase.storage.from('assignment-resources').getPublicUrl(storagePath);
        if (publicData?.publicUrl) {
          uploadedResources.push({ title: file.name, url: publicData.publicUrl });
        }
      }

      const { data: createdAssignment, error } = await supabase
        .from('class_assignments')
        .insert({
          class_id: classId,
          title,
          description,
          resources: [...resources, ...uploadedResources],
          due_at: dueAt,
          assigned_to: assignedTo,
          created_by_user_id: user.id,
        })
        .select('id')
        .single();
      if (error || !createdAssignment?.id) {
        const message = error?.message || 'Could not create assignment.';
        set({ error: message });
        throw new Error(message);
      }
      trackAnalyticsEvent({
        eventType: 'assignment_created',
        classId,
        metadata: { assignedTo },
      });

      if (assignedTo === 'individuals' && assignedStudentIds.length > 0) {
        const { error: recipientsError } = await supabase.from('assignment_recipients').insert(
          assignedStudentIds.map((studentId) => ({
            assignment_id: createdAssignment.id,
            class_id: classId,
            student_user_id: studentId,
          }))
        );
        if (recipientsError) {
          throw new Error(recipientsError.message);
        }
      }
      await get().loadWorkspace();
  },

  submitAssignment: async ({ classId, assignmentId, submissionNote, file }) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'STUDENT') {
        const message = 'Only students can submit homework.';
        set({ error: message });
        throw new Error(message);
      }

      if (!file) {
        const message = 'Attach a file to submit homework.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const submittedAt = new Date().toISOString();
        set((state) => ({
          classes: state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            return {
              ...entry,
              assignments: entry.assignments.map((assignment) => {
                if (assignment.id !== assignmentId) return assignment;
                const existing = assignment.submissions.find((submission) => submission.studentId === user.id);
                const updatedSubmission = {
                  id: existing?.id || randomId('submission'),
                  assignmentId,
                  studentId: user.id,
                  studentName: user.name || user.email,
                  submissionNote: submissionNote.trim(),
                  fileUrl: '#',
                  submittedAt,
                  status: 'submitted' as const,
                  gradeScore: null,
                  feedback: '',
                  gradedAt: null,
                };
                const nextSubmissions = existing
                  ? assignment.submissions.map((submission) => (submission.id === existing.id ? updatedSubmission : submission))
                  : [updatedSubmission, ...assignment.submissions];
                return {
                  ...assignment,
                  submissions: nextSubmissions,
                  mySubmission: updatedSubmission,
                  submissionsPendingReview: nextSubmissions.filter((submission) => submission.status !== 'graded').length,
                };
              }),
            };
          }),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
      const filePath = `${classId}/${assignmentId}/${user.id}/${Date.now()}-${randomId('submission')}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('assignment-submissions').upload(filePath, file, {
        upsert: false,
      });
      if (uploadError) {
        throw new Error(`Could not upload "${file.name}". ${uploadError.message}`);
      }

      const { error } = await supabase.from('assignment_submissions').upsert({
        assignment_id: assignmentId,
        class_id: classId,
        student_user_id: user.id,
        submission_note: submissionNote.trim(),
        file_path: filePath,
        status: 'submitted',
        grade_score: null,
        feedback: '',
        graded_at: null,
      }, {
        onConflict: 'assignment_id,student_user_id',
      });
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      trackAnalyticsEvent({
        eventType: 'assignment_submitted',
        classId,
        metadata: { assignmentId },
      });

      await get().loadWorkspace();
  },

  gradeAssignmentSubmission: async ({ classId, assignmentId, submissionId, gradeScore, feedback }) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'TEACHER') {
        const message = 'Only teachers can grade submissions.';
        set({ error: message });
        throw new Error(message);
      }

      const normalizedScore = Math.max(0, Math.min(100, Math.round(gradeScore)));
      const trimmedFeedback = feedback.trim();

      if (isDemoUser(user)) {
        const gradedAt = new Date().toISOString();
        set((state) => ({
          classes: state.classes.map((entry) => {
            if (entry.id !== classId) return entry;
            return {
              ...entry,
              assignments: entry.assignments.map((assignment) => {
                if (assignment.id !== assignmentId) return assignment;
                const nextSubmissions = assignment.submissions.map((submission) => (
                  submission.id === submissionId
                    ? {
                      ...submission,
                      status: 'graded' as const,
                      gradeScore: normalizedScore,
                      feedback: trimmedFeedback,
                      gradedAt,
                    }
                    : submission
                ));
                return {
                  ...assignment,
                  submissions: nextSubmissions,
                  submissionsPendingReview: nextSubmissions.filter((submission) => submission.status !== 'graded').length,
                };
              }),
            };
          }),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          status: 'graded',
          grade_score: normalizedScore,
          feedback: trimmedFeedback,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .eq('assignment_id', assignmentId)
        .eq('class_id', classId);
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      trackAnalyticsEvent({
        eventType: 'assignment_graded',
        classId,
        metadata: { assignmentId },
      });

      await get().loadWorkspace();
  },

  updateStudentNote: async (studentId, note) => {
      const user = getCurrentUser();
      if (!user || user.role !== 'TEACHER') {
        const message = 'Only teachers can update learner notes.';
        set({ error: message });
        throw new Error(message);
      }
      const trimmedNote = note.trim();
      if (!trimmedNote) {
        const message = 'Note cannot be empty.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        set((state) => ({
          students: state.students.map((entry) => (
            entry.id === studentId
              ? { ...entry, note: trimmedNote }
              : entry
          )),
          classes: state.classes.map((entry) => ({
            ...entry,
            students: entry.students.map((student) => (
              student.id === studentId
                ? { ...student, note: trimmedNote }
                : student
            )),
          })),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('student_insights')
        .upsert({
          user_id: studentId,
          note: trimmedNote,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      await get().loadWorkspace();
  },

  sendClassMessage: async (classId, body) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to send messages.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const sentAt = new Date().toISOString();
        set((state) => ({
          classes: state.classes.map((entry) => (
            entry.id === classId
              ? {
                ...entry,
                messages: [
                  {
                    id: randomId('message'),
                    sender: user.name || user.email,
                    role: user.role === 'STUDENT' ? 'student' : 'teacher',
                    body,
                    sentAt,
                    syncStatus: 'synced',
                  },
                  ...entry.messages,
                ],
                activity: [
                  {
                    id: randomId('activity'),
                    title: 'Announcement posted',
                    detail: body.slice(0, 72),
                    timestamp: sentAt,
                  },
                  ...entry.activity,
                ],
              }
              : entry
          )),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const undoId = randomId('undo');
      const expiresAt = Date.now() + UNDO_WINDOW_MS;
      const { data, error } = await supabase
        .from('class_messages')
        .insert({
          class_id: classId,
          sender_user_id: user.id,
          sender_display_name: user.name || user.email,
          role: user.role === 'STUDENT' ? 'student' : 'teacher',
          body,
        })
        .select('id')
        .single();

      if (error || !data) {
        const message = error?.message || 'Could not send message.';
        set({ error: message });
        throw new Error(message);
      }

      const previousUndo = get().undoItem;
      if (previousUndo) clearUndoTimer(previousUndo.id);
      set((state) => ({
        undoItem: {
          id: undoId,
          label: 'Announcement sent',
          kind: 'message',
          classId,
          targetId: data.id,
          expiresAt,
        },
        revision: state.revision + 1,
      }));

      const expiryTimer = window.setTimeout(() => {
        set((state) => {
          if (state.undoItem?.id !== undoId) return state;
          return { undoItem: null };
        });
        undoTimers.delete(undoId);
      }, UNDO_WINDOW_MS);
      undoTimers.set(undoId, expiryTimer);
      trackAnalyticsEvent({
        eventType: 'class_message_sent',
        classId,
      });

      await get().loadWorkspace();
  },

  uploadClassResource: async ({ classId, title, description, kind, noteBody, externalUrl, file }) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to upload class resources.';
        set({ error: message });
        throw new Error(message);
      }

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        const message = 'Resource title is required.';
        set({ error: message });
        throw new Error(message);
      }

      const trimmedDescription = description.trim();
      const trimmedNote = (noteBody || '').trim();
      const trimmedExternalUrl = (externalUrl || '').trim();

      if (kind === 'note' && !trimmedNote) {
        const message = 'Notes must include content.';
        set({ error: message });
        throw new Error(message);
      }
      if (kind !== 'note' && !file && !trimmedExternalUrl) {
        const message = 'Attach a file or provide a link.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const createdAt = new Date().toISOString();
        const finalKind = file ? inferResourceKindFromFile(file) : kind;
        set((state) => ({
          classes: state.classes.map((entry) => (
            entry.id === classId
              ? {
                ...entry,
                resources: [
                  {
                    id: randomId('resource'),
                    title: trimmedTitle,
                    description: trimmedDescription,
                    kind: finalKind,
                    noteBody: finalKind === 'note' ? trimmedNote : '',
                    fileUrl: file ? '#' : '',
                    externalUrl: trimmedExternalUrl,
                    createdAt,
                    createdByName: user.name || user.email,
                  },
                  ...entry.resources,
                ],
              }
              : entry
          )),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      let filePath: string | null = null;
      let finalKind = kind;
      if (file) {
        finalKind = inferResourceKindFromFile(file);
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
        filePath = `${classId}/${Date.now()}-${randomId('resource')}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('class-resources').upload(filePath, file, {
          upsert: false,
        });
        if (uploadError) {
          throw new Error(`Could not upload "${file.name}". ${uploadError.message}`);
        }
      }

      const { error } = await supabase.from('class_resources').insert({
        class_id: classId,
        title: trimmedTitle,
        description: trimmedDescription,
        kind: finalKind,
        note_body: finalKind === 'note' ? trimmedNote : '',
        file_path: filePath,
        external_url: trimmedExternalUrl || null,
        created_by_user_id: user.id,
      });
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      trackAnalyticsEvent({
        eventType: 'class_resource_uploaded',
        classId,
        metadata: { kind: finalKind },
      });
      await get().loadWorkspace();
  },

  openDirectConversation: async (classId, otherUserId) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to start a conversation.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const classes = get().classes;
        const targetClass = classes.find((entry) => entry.id === classId);
        const participant = targetClass?.students.find((entry) => entry.id === otherUserId)
          || (targetClass?.teachers || []).find((entry) => entry.id === otherUserId);
        if (!targetClass || !participant) {
          const message = 'Could not start this conversation in demo mode.';
          set({ error: message });
          throw new Error(message);
        }
        const existing = get().directConversations.find(
          (entry) => entry.classId === classId && entry.participantUserId === otherUserId
        );
        if (existing) return existing.id;
        const conversationId = randomId('conversation');
        set((state) => ({
          directConversations: [
            {
              id: conversationId,
              classId,
              className: targetClass.name,
              participantUserId: otherUserId,
              participantName: participant.name,
              participantEmail: participant.email,
              lastMessagePreview: '',
              lastMessageAt: null,
              messages: [],
            },
            ...state.directConversations,
          ],
          revision: state.revision + 1,
          error: null,
        }));
        return conversationId;
      }

      const { data, error } = await supabase.rpc('upsert_direct_conversation', {
        p_class_id: classId,
        p_other_user_id: otherUserId,
      });
      if (error || !data) {
        const message = error?.message || 'Could not open conversation.';
        set({ error: message });
        throw new Error(message);
      }
      await get().loadWorkspace();
      return data as string;
  },

  sendDirectMessage: async (conversationId, body) => {
      const user = getCurrentUser();
      if (!user) {
        const message = 'You must be signed in to send a message.';
        set({ error: message });
        throw new Error(message);
      }

      const trimmed = body.trim();
      if (!trimmed) {
        const message = 'Message cannot be empty.';
        set({ error: message });
        throw new Error(message);
      }

      if (isDemoUser(user)) {
        const sentAt = new Date().toISOString();
        set((state) => ({
          directConversations: state.directConversations
            .map((entry) => (
              entry.id === conversationId
                ? {
                  ...entry,
                  lastMessageAt: sentAt,
                  lastMessagePreview: trimmed,
                  messages: [
                    ...entry.messages,
                    {
                      id: randomId('dm'),
                      conversationId: entry.id,
                      senderUserId: user.id,
                      senderName: user.name || user.email,
                      body: trimmed,
                      sentAt,
                      syncStatus: 'synced' as const,
                    },
                  ],
                }
                : entry
            ))
            .sort((a, b) => {
              const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return bTime - aTime;
            }),
          revision: state.revision + 1,
          error: null,
        }));
        return;
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_user_id: user.id,
          sender_display_name: user.name || user.email,
          body: trimmed,
        });
      if (error) {
        const message = error.message || 'Could not send direct message.';
        set({ error: message });
        throw new Error(message);
      }

      // Optimistic update so message appears immediately without a full workspace reload
      const sentAt = new Date().toISOString();
      set((state) => ({
        directConversations: state.directConversations
          .map((entry) => (
            entry.id !== conversationId ? entry : {
              ...entry,
              lastMessageAt: sentAt,
              lastMessagePreview: trimmed,
              messages: [
                ...entry.messages,
                {
                  id: randomId('dm'),
                  conversationId,
                  senderUserId: user.id,
                  senderName: user.name || user.email,
                  body: trimmed,
                  sentAt,
                  syncStatus: 'synced' as const,
                },
              ],
            }
          ))
          .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          }),
        revision: state.revision + 1,
        error: null,
      }));
  },

  receiveDirectMessage: (conversationId, message) => {
    set((state) => {
      const exists = state.directConversations.some((c) => c.id === conversationId);
      if (!exists) return state;
      return {
        directConversations: state.directConversations
          .map((entry) => {
            if (entry.id !== conversationId) return entry;
            if (entry.messages.some((m) => m.id === message.id)) return entry;
            return {
              ...entry,
              lastMessageAt: message.sentAt,
              lastMessagePreview: message.body,
              messages: [...entry.messages, message],
            };
          })
          .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          }),
        revision: state.revision + 1,
      };
    });
  },

  receiveClassMessage: (classId, message) => {
    set((state) => ({
      classes: state.classes.map((entry) => {
        if (entry.id !== classId) return entry;
        if (entry.messages.some((m) => m.id === message.id)) return entry;
        return { ...entry, messages: [message, ...entry.messages] };
      }),
      revision: state.revision + 1,
    }));
  },

  setLessonRecording: (classId, lessonId, recordingUrl) => {
    set((state) => ({
      classes: state.classes.map((entry) => (
        entry.id !== classId ? entry : {
          ...entry,
          lessons: entry.lessons.map((lesson) => (
            lesson.id !== lessonId ? lesson : { ...lesson, recordingUrl }
          )),
        }
      )),
      revision: state.revision + 1,
    }));
  },

  setLessonAiRecap: (classId, lessonId, recap) => {
    set((state) => ({
      classes: state.classes.map((entry) => (
        entry.id !== classId ? entry : {
          ...entry,
          lessons: entry.lessons.map((lesson) => (
            lesson.id !== lessonId ? lesson : { ...lesson, aiRecap: recap }
          )),
        }
      )),
      revision: state.revision + 1,
    }));
  },

  updatePaymentStatus: (paymentId, status) =>
    set((state) => ({
      payments: state.payments.map((payment) => (payment.id === paymentId ? { ...payment, status } : payment)),
      revision: state.revision + 1,
    })),

  undoLastAction: () => {
    void (async () => {
      const undoItem = get().undoItem;
      if (!undoItem) return;
      clearUndoTimer(undoItem.id);

      if (undoItem.kind === 'lesson') {
        await supabase.from('lessons').delete().eq('id', undoItem.targetId).eq('class_id', undoItem.classId);
      } else {
        await supabase.from('class_messages').delete().eq('id', undoItem.targetId).eq('class_id', undoItem.classId);
      }
      set({ undoItem: null });
      await get().loadWorkspace();
    })();
  },

  clearUndo: () =>
    set((state) => {
      if (state.undoItem) clearUndoTimer(state.undoItem.id);
      return { undoItem: null };
    }),
}));
