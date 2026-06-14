import { describe, it, expect, beforeEach } from 'vitest';
import { useTeacherHubStore } from './teacherHub';
import { useAuthStore } from './auth';

const DEMO_PASSWORD = 'SkillStreamDemo123!';

const RESET_TEACHER_HUB = {
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
};

const RESET_AUTH = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  notice: null,
};

async function loginAsTeacher() {
  await useAuthStore.getState().login('teacher@skillstream.demo', DEMO_PASSWORD);
}

async function loginAsStudent() {
  await useAuthStore.getState().login('student@skillstream.demo', DEMO_PASSWORD);
}

beforeEach(() => {
  useTeacherHubStore.setState(RESET_TEACHER_HUB);
  useAuthStore.setState(RESET_AUTH);
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// loadWorkspace — demo mode
// ---------------------------------------------------------------------------
describe('loadWorkspace (demo teacher)', () => {
  it('populates classes and students after login', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const { classes, students, isHydrated } = useTeacherHubStore.getState();
    expect(isHydrated).toBe(true);
    expect(classes.length).toBeGreaterThan(0);
    expect(students.length).toBeGreaterThan(0);
  });

  it('populates tasks for the demo teacher', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const { tasks } = useTeacherHubStore.getState();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('sets isHydrated without Supabase when user is null', async () => {
    await useTeacherHubStore.getState().loadWorkspace();
    const { isHydrated, classes } = useTeacherHubStore.getState();
    expect(isHydrated).toBe(true);
    expect(classes).toHaveLength(0);
  });

  it('does not re-fetch if demo workspace already loaded', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const revisionBefore = useTeacherHubStore.getState().revision;
    await useTeacherHubStore.getState().loadWorkspace();
    expect(useTeacherHubStore.getState().revision).toBe(revisionBefore + 1);
  });
});

// ---------------------------------------------------------------------------
// createClass — demo mode
// ---------------------------------------------------------------------------
describe('createClass (demo teacher)', () => {
  it('prepends a new class to the classes list', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const before = useTeacherHubStore.getState().classes.length;

    await useTeacherHubStore.getState().createClass({ name: 'Test Class', overview: 'A test overview' });
    const { classes } = useTeacherHubStore.getState();
    expect(classes.length).toBe(before + 1);
    expect(classes[0].name).toBe('Test Class');
    expect(classes[0].overview).toBe('A test overview');
  });

  it('assigns a non-empty invite code to the new class', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    await useTeacherHubStore.getState().createClass({ name: 'Code Test', overview: 'overview' });
    const { classes } = useTeacherHubStore.getState();
    expect(classes[0].inviteCode).toBeTruthy();
  });

  it('increments revision after creating a class', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const revBefore = useTeacherHubStore.getState().revision;
    await useTeacherHubStore.getState().createClass({ name: 'Rev Test', overview: 'overview' });
    expect(useTeacherHubStore.getState().revision).toBe(revBefore + 1);
  });

  it('rejects class creation when user is not a teacher', async () => {
    await loginAsStudent();
    await expect(
      useTeacherHubStore.getState().createClass({ name: 'Forbidden', overview: 'overview' }),
    ).rejects.toThrow('Only teachers can create classes');
  });
});

// ---------------------------------------------------------------------------
// scheduleLesson — demo mode
// ---------------------------------------------------------------------------
describe('scheduleLesson (demo teacher)', () => {
  it('adds a lesson to the target class', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    const lessonsBefore = useTeacherHubStore.getState().classes[0].lessons.length;

    const futureAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await useTeacherHubStore.getState().scheduleLesson({
      classId,
      title: 'New Lesson',
      scheduledAt: futureAt,
      durationMinutes: 60,
    });

    const target = useTeacherHubStore.getState().classes.find((c) => c.id === classId)!;
    expect(target.lessons.length).toBe(lessonsBefore + 1);
    expect(target.lessons.some((l) => l.title === 'New Lesson')).toBe(true);
  });

  it('rejects a lesson scheduled in the past', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    const pastAt = new Date(Date.now() - 60_000).toISOString();
    await expect(
      useTeacherHubStore.getState().scheduleLesson({ classId, title: 'Past', scheduledAt: pastAt, durationMinutes: 30 }),
    ).rejects.toThrow('Lesson time must be in the future');
  });
});

// ---------------------------------------------------------------------------
// cancelLesson — demo mode
// ---------------------------------------------------------------------------
describe('cancelLesson (demo teacher)', () => {
  it('marks the lesson status as cancelled', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const target = useTeacherHubStore.getState().classes[0];
    const lessonId = target.lessons[0].id;

    await useTeacherHubStore.getState().cancelLesson(target.id, lessonId);
    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === target.id)!;
    const lesson = updated.lessons.find((l) => l.id === lessonId)!;
    expect(lesson.status).toBe('cancelled');
    expect(lesson.state).toBe('cancelled');
  });

  it('does not affect other lessons in the same class', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const target = useTeacherHubStore.getState().classes[0];
    const [first, second] = target.lessons;
    if (!second) return;

    await useTeacherHubStore.getState().cancelLesson(target.id, first.id);
    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === target.id)!;
    const other = updated.lessons.find((l) => l.id === second.id)!;
    expect(other.status).not.toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// sendClassMessage — demo mode
// ---------------------------------------------------------------------------
describe('sendClassMessage (demo teacher)', () => {
  it('prepends a message to the class feed', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    const before = useTeacherHubStore.getState().classes[0].messages.length;

    await useTeacherHubStore.getState().sendClassMessage(classId, 'Hello class!');
    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === classId)!;
    expect(updated.messages.length).toBe(before + 1);
    expect(updated.messages[0].body).toBe('Hello class!');
    expect(updated.messages[0].role).toBe('teacher');
  });

  it('assigns teacher role to message when sent by demo teacher', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    await useTeacherHubStore.getState().sendClassMessage(classId, 'Role check');
    const msg = useTeacherHubStore.getState().classes[0].messages[0];
    expect(msg.role).toBe('teacher');
  });

  it('assigns student role when sent by demo student', async () => {
    await loginAsStudent();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    await useTeacherHubStore.getState().sendClassMessage(classId, 'Student message');
    const msg = useTeacherHubStore.getState().classes[0].messages[0];
    expect(msg.role).toBe('student');
  });
});

// ---------------------------------------------------------------------------
// receiveClassMessage — realtime push
// ---------------------------------------------------------------------------
describe('receiveClassMessage', () => {
  it('inserts a new message into the class feed', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    const before = useTeacherHubStore.getState().classes[0].messages.length;

    useTeacherHubStore.getState().receiveClassMessage(classId, {
      id: 'rt-msg-1',
      sender: 'Test Student',
      role: 'student',
      body: 'Realtime message',
      sentAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === classId)!;
    expect(updated.messages.length).toBe(before + 1);
    expect(updated.messages[0].body).toBe('Realtime message');
  });

  it('deduplicates messages with the same id', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;

    const msg = {
      id: 'dup-msg',
      sender: 'Student',
      role: 'student' as const,
      body: 'Dupe',
      sentAt: new Date().toISOString(),
      syncStatus: 'synced' as const,
    };

    useTeacherHubStore.getState().receiveClassMessage(classId, msg);
    useTeacherHubStore.getState().receiveClassMessage(classId, msg);

    const count = useTeacherHubStore.getState().classes
      .find((c) => c.id === classId)!.messages.filter((m) => m.id === 'dup-msg').length;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// setLessonAiRecap
// ---------------------------------------------------------------------------
describe('setLessonAiRecap', () => {
  it('stores the recap on the correct lesson', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const cls = useTeacherHubStore.getState().classes[0];
    const lessonId = cls.lessons[0].id;

    useTeacherHubStore.getState().setLessonAiRecap(cls.id, lessonId, 'Great recap');
    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === cls.id)!;
    const lesson = updated.lessons.find((l) => l.id === lessonId)!;
    expect(lesson.aiRecap).toBe('Great recap');
  });

  it('does not overwrite other lessons', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const cls = useTeacherHubStore.getState().classes[0];
    const [first, second] = cls.lessons;
    if (!second) return;

    useTeacherHubStore.getState().setLessonAiRecap(cls.id, first.id, 'Only first');
    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === cls.id)!;
    expect(updated.lessons.find((l) => l.id === second.id)?.aiRecap).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateClassDetails — demo mode
// ---------------------------------------------------------------------------
describe('updateClassDetails (demo teacher)', () => {
  it('updates name and overview for the correct class', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;

    await useTeacherHubStore.getState().updateClassDetails(classId, {
      name: 'Renamed Class',
      overview: 'Updated overview',
    });

    const updated = useTeacherHubStore.getState().classes.find((c) => c.id === classId)!;
    expect(updated.name).toBe('Renamed Class');
    expect(updated.overview).toBe('Updated overview');
  });

  it('rejects empty name', async () => {
    await loginAsTeacher();
    await useTeacherHubStore.getState().loadWorkspace();
    const classId = useTeacherHubStore.getState().classes[0].id;
    await expect(
      useTeacherHubStore.getState().updateClassDetails(classId, { name: '', overview: 'ok' }),
    ).rejects.toThrow();
  });
});
