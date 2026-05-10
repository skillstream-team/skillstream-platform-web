export type TaskStatus = 'urgent' | 'soon' | 'done';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type ProgressTone = 'strong' | 'steady' | 'attention';

export interface TeacherTask {
  id: string;
  title: string;
  detail: string;
  dueAt: string;
  status: TaskStatus;
  actionLabel: string;
  actionPath: string;
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  progress: number;
  lastActivity: string;
  homeworkCompletion: number;
  classes: string[];
  note: string;
  needsAttention?: boolean;
}

export interface LessonSummary {
  id: string;
  title: string;
  classId: string;
  className: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'today' | 'upcoming' | 'completed' | 'cancelled';
  state: 'scheduled' | 'live' | 'completed' | 'cancelled';
  studentCount: number;
  syncStatus?: 'pending' | 'synced';
  recordingUrl?: string;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description: string;
  resources: Array<{ title: string; url: string }>;
  dueAt: string;
  completionRate: number;
  submissionsPendingReview: number;
  assignedTo: 'class' | 'individuals';
  assignedStudentIds?: string[];
  submissions: AssignmentSubmissionSummary[];
  mySubmission?: AssignmentSubmissionSummary;
}

export interface AssignmentSubmissionSummary {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submissionNote: string;
  fileUrl: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  gradeScore: number | null;
  feedback: string;
  gradedAt: string | null;
}

export interface TopicInsight {
  topic: string;
  mastery: number;
  tone: ProgressTone;
  note: string;
}

export interface ClassMessage {
  id: string;
  sender: string;
  role: 'teacher' | 'student' | 'system';
  body: string;
  sentAt: string;
  syncStatus?: 'pending' | 'synced';
}

export type ClassResourceKind = 'note' | 'document' | 'pdf' | 'video';

export interface ClassResourceSummary {
  id: string;
  title: string;
  description: string;
  kind: ClassResourceKind;
  noteBody: string;
  fileUrl: string;
  externalUrl: string;
  createdAt: string;
  createdByName: string;
}

export interface DirectConversationMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  body: string;
  sentAt: string;
  syncStatus?: 'pending' | 'synced';
}

export interface DirectConversationSummary {
  id: string;
  classId: string;
  className: string;
  participantUserId: string;
  participantName: string;
  participantEmail: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  messages: DirectConversationMessage[];
}

export interface ClassActivity {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  dueAt: string;
  status: PaymentStatus;
}

export interface TeacherClass {
  id: string;
  name: string;
  accent: string;
  studentCount: number;
  nextSessionAt: string;
  inviteCode: string;
  inviteLink: string;
  overview: string;
  teachers?: Array<{ id: string; name: string; email: string }>;
  students: StudentSummary[];
  lessons: LessonSummary[];
  assignments: AssignmentSummary[];
  resources: ClassResourceSummary[];
  topics: TopicInsight[];
  messages: ClassMessage[];
  activity: ClassActivity[];
}

export const normalizeLessonStatus = (
  dateString: string,
  state: LessonSummary['state'] = 'scheduled'
): LessonSummary['status'] => {
  if (state === 'cancelled') return 'cancelled';
  if (state === 'completed') return 'completed';
  const date = new Date(dateString);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (date < now) return 'completed';
  if (sameDay) return 'today';
  return 'upcoming';
};

export const buildTeacherTasks = (input: {
  pendingAssignmentReviews: number;
  nextReviewDueAt?: string;
  pendingMessages: number;
  nextMessageDueAt?: string;
  overdueStudentCount: number;
  nextSupportDueAt?: string;
}): TeacherTask[] => {
  const now = Date.now();
  const tasks: TeacherTask[] = [];

  if (input.pendingAssignmentReviews > 0) {
    tasks.push({
      id: 'task-review',
      title: `Review ${input.pendingAssignmentReviews} submission${input.pendingAssignmentReviews === 1 ? '' : 's'}`,
      detail: 'Homework reviews are waiting.',
      dueAt: input.nextReviewDueAt || new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      status: 'urgent',
      actionLabel: 'Open classes',
      actionPath: '/classes',
    });
  }

  if (input.pendingMessages > 0) {
    tasks.push({
      id: 'task-message',
      title: `Reply to ${input.pendingMessages} message${input.pendingMessages === 1 ? '' : 's'}`,
      detail: 'Learner questions are waiting.',
      dueAt: input.nextMessageDueAt || new Date(now + 3 * 60 * 60 * 1000).toISOString(),
      status: 'soon',
      actionLabel: 'Open messages',
      actionPath: '/messages',
    });
  }

  if (input.overdueStudentCount > 0) {
    tasks.push({
      id: 'task-support',
      title: `${input.overdueStudentCount} learner${input.overdueStudentCount === 1 ? ' needs' : 's need'} attention`,
      detail: 'Follow up on lower completion or progress.',
      dueAt: input.nextSupportDueAt || new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      status: 'soon',
      actionLabel: 'Open students',
      actionPath: '/students',
    });
  }

  return tasks;
};

export const getTeacherAiSuggestions = (input: { classesCount: number; attentionCount: number }): string[] => {
  if (input.classesCount === 0) {
    return ['Create your first class to start scheduling lessons.'];
  }
  if (input.attentionCount > 0) {
    return ['Prioritize a short intervention plan for learners marked as attention needed.'];
  }
  return ['Your classes are stable. Keep lesson feedback loops tight and short.'];
};
