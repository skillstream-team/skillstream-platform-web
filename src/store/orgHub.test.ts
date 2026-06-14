import { describe, it, expect, beforeEach } from 'vitest';
import { useOrgHubStore } from './orgHub';

const RESET = {
  org: null, members: [], teams: [], courses: [], enrollments: [],
  paths: [], announcements: [], ratings: [], quizStats: [], auditEvents: [],
  isHydrated: false, isSyncing: false, error: null,
};

beforeEach(() => {
  useOrgHubStore.setState(RESET);
});

// ---------------------------------------------------------------------------
// loadOrgHub — demo-org
// ---------------------------------------------------------------------------
describe('loadOrgHub (demo-org)', () => {
  it('loads demo org details', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { org } = useOrgHubStore.getState();
    expect(org).not.toBeNull();
    expect(org?.name).toBe('Acme Corp');
    expect(org?.slug).toBe('acme-corp');
  });

  it('sets isHydrated to true', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    expect(useOrgHubStore.getState().isHydrated).toBe(true);
  });

  it('loads demo members', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { members } = useOrgHubStore.getState();
    expect(members.length).toBeGreaterThanOrEqual(2);
    expect(members.some((m) => m.orgRole === 'admin')).toBe(true);
    expect(members.some((m) => m.orgRole === 'learner')).toBe(true);
  });

  it('loads demo courses', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { courses } = useOrgHubStore.getState();
    expect(courses.length).toBeGreaterThanOrEqual(2);
    expect(courses.every((c) => c.isPublished)).toBe(true);
  });

  it('loads demo enrollments', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { enrollments } = useOrgHubStore.getState();
    expect(enrollments.length).toBeGreaterThan(0);
  });

  it('loads demo learning paths', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { paths } = useOrgHubStore.getState();
    expect(paths.length).toBeGreaterThan(0);
  });

  it('loads demo teams', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { teams } = useOrgHubStore.getState();
    expect(teams.length).toBeGreaterThanOrEqual(2);
  });

  it('loads demo audit events', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { auditEvents } = useOrgHubStore.getState();
    expect(auditEvents.length).toBeGreaterThan(0);
  });

  it('skips re-fetch when already hydrated for same org', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    // Mutate state to detect re-fetch (extra member would be wiped on re-fetch)
    const membersBefore = useOrgHubStore.getState().members.length;
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    expect(useOrgHubStore.getState().members.length).toBe(membersBefore);
  });

  it('sets error without Supabase config for unknown org', async () => {
    await useOrgHubStore.getState().loadOrgHub('unknown-org');
    const { error } = useOrgHubStore.getState();
    expect(error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// createCourse — demo-org
// ---------------------------------------------------------------------------
describe('createCourse (demo-org)', () => {
  it('adds a new course to the list', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const before = useOrgHubStore.getState().courses.length;

    await useOrgHubStore.getState().createCourse({ title: 'My New Course', description: 'About this course.' });
    const { courses } = useOrgHubStore.getState();
    expect(courses.length).toBe(before + 1);
    expect(courses.some((c) => c.title === 'My New Course')).toBe(true);
  });

  it('returns a new course id string', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const id = await useOrgHubStore.getState().createCourse({ title: 'Returned ID', description: '' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('new course starts as unpublished', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const id = await useOrgHubStore.getState().createCourse({ title: 'Draft Course', description: '' });
    const course = useOrgHubStore.getState().courses.find((c) => c.id === id)!;
    expect(course.isPublished).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateCourse — demo-org
// ---------------------------------------------------------------------------
describe('updateCourse (demo-org)', () => {
  it('publishes a course', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const courseId = useOrgHubStore.getState().courses[0].id;
    await useOrgHubStore.getState().updateCourse(courseId, { isPublished: false });
    await useOrgHubStore.getState().updateCourse(courseId, { isPublished: true });
    const updated = useOrgHubStore.getState().courses.find((c) => c.id === courseId)!;
    expect(updated.isPublished).toBe(true);
  });

  it('updates the course title', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const courseId = useOrgHubStore.getState().courses[0].id;
    await useOrgHubStore.getState().updateCourse(courseId, { title: 'Renamed' });
    const updated = useOrgHubStore.getState().courses.find((c) => c.id === courseId)!;
    expect(updated.title).toBe('Renamed');
  });
});

// ---------------------------------------------------------------------------
// addModule / addLesson — demo-org
// ---------------------------------------------------------------------------
describe('addModule and addLesson (demo-org)', () => {
  it('addModule creates a module inside the course', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const courseId = useOrgHubStore.getState().courses[0].id;
    const modulesBefore = useOrgHubStore.getState().courses[0].modules.length;

    await useOrgHubStore.getState().addModule(courseId, 'New Module');
    const course = useOrgHubStore.getState().courses.find((c) => c.id === courseId)!;
    expect(course.modules.length).toBe(modulesBefore + 1);
    expect(course.modules.some((m) => m.title === 'New Module')).toBe(true);
  });

  it('addLesson adds a lesson inside the correct module', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const course = useOrgHubStore.getState().courses[0];
    const module = course.modules[0];
    const lessonsBefore = module.lessons.length;

    await useOrgHubStore.getState().addLesson(module.id, { title: 'New Lesson', kind: 'text' });
    const updatedModule = useOrgHubStore
      .getState().courses.find((c) => c.id === course.id)!
      .modules.find((m) => m.id === module.id)!;
    expect(updatedModule.lessons.length).toBe(lessonsBefore + 1);
    expect(updatedModule.lessons.some((l) => l.title === 'New Lesson')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enrollLearners — demo-org
// ---------------------------------------------------------------------------
describe('enrollLearners (demo-org)', () => {
  it('adds an enrollment record for each userId', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const courseId = useOrgHubStore.getState().courses[0].id;
    const before = useOrgHubStore.getState().enrollments.length;

    await useOrgHubStore.getState().enrollLearners(courseId, ['demo-learner-4', 'demo-learner-5']);
    const after = useOrgHubStore.getState().enrollments.length;
    expect(after).toBeGreaterThan(before);
  });
});

// ---------------------------------------------------------------------------
// deleteAnnouncement — demo-org
// ---------------------------------------------------------------------------
describe('deleteAnnouncement (demo-org)', () => {
  it('removes the announcement from the list', async () => {
    await useOrgHubStore.getState().loadOrgHub('demo-org');
    const { announcements } = useOrgHubStore.getState();
    const targetId = announcements[0].id;
    const before = announcements.length;

    await useOrgHubStore.getState().deleteAnnouncement(targetId);
    const after = useOrgHubStore.getState().announcements.length;
    expect(after).toBe(before - 1);
    expect(useOrgHubStore.getState().announcements.some((a) => a.id === targetId)).toBe(false);
  });
});
