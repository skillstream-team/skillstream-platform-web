import { describe, it, expect, beforeEach } from 'vitest';
import { useLearnerHubStore } from './learnerHub';

const RESET = {
  enrolledCourses: [],
  certificates: [],
  orgAnnouncements: [],
  enrolledPaths: [],
  player: null,
  isHydrated: false,
  isSyncing: false,
  isMarkingComplete: false,
  error: null,
};

beforeEach(() => {
  useLearnerHubStore.setState(RESET);
});

// ---------------------------------------------------------------------------
// loadLearnerHub — demo-learner
// ---------------------------------------------------------------------------
describe('loadLearnerHub (demo learner)', () => {
  it('populates enrolledCourses for a demo learner id', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('demo-learner');
    const { enrolledCourses, isHydrated } = useLearnerHubStore.getState();
    expect(isHydrated).toBe(true);
    expect(enrolledCourses.length).toBeGreaterThan(0);
  });

  it('loads certificates', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('demo-learner');
    const { certificates } = useLearnerHubStore.getState();
    expect(certificates.length).toBeGreaterThan(0);
  });

  it('loads org announcements', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('demo-learner');
    const { orgAnnouncements } = useLearnerHubStore.getState();
    expect(orgAnnouncements.length).toBeGreaterThan(0);
  });

  it('loads enrolled learning paths', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('demo-learner');
    const { enrolledPaths } = useLearnerHubStore.getState();
    expect(enrolledPaths.length).toBeGreaterThan(0);
  });

  it('returns completion percent between 0 and 100 for each course', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('demo-learner');
    const { enrolledCourses } = useLearnerHubStore.getState();
    enrolledCourses.forEach((c) => {
      expect(c.completionPercent).toBeGreaterThanOrEqual(0);
      expect(c.completionPercent).toBeLessThanOrEqual(100);
    });
  });

  it('sets isHydrated true even without Supabase config for non-demo userId', async () => {
    await useLearnerHubStore.getState().loadLearnerHub('real-user-id');
    expect(useLearnerHubStore.getState().isHydrated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// loadCoursePlayer — demo enrollment
// ---------------------------------------------------------------------------
describe('loadCoursePlayer (demo enrollment)', () => {
  it('populates the player with course data', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const { player } = useLearnerHubStore.getState();
    expect(player).not.toBeNull();
    expect(player?.course).not.toBeNull();
    expect(player?.course?.modules.length).toBeGreaterThan(0);
  });

  it('pre-fills completedLessonIds from demo progress', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const { player } = useLearnerHubStore.getState();
    expect(player?.completedLessonIds.size).toBeGreaterThan(0);
  });

  it('sets activeLessonId to the first incomplete lesson', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const { player } = useLearnerHubStore.getState();
    const activeLessonId = player?.activeLessonId;
    expect(activeLessonId).toBeTruthy();
    // The active lesson should NOT be in the completed set for demo-enroll-1
    // (unless all lessons are done, in which case first lesson is selected)
    if (player && player.completedLessonIds.size < (player.course?.modules.flatMap((m) => m.lessons).length ?? 0)) {
      expect(player.completedLessonIds.has(activeLessonId!)).toBe(false);
    }
  });

  it('loads a different course for demo-enroll-2', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-2', 'demo-enroll-2');
    const { player } = useLearnerHubStore.getState();
    expect(player?.course?.title).toContain('GDPR');
  });
});

// ---------------------------------------------------------------------------
// setActiveLesson
// ---------------------------------------------------------------------------
describe('setActiveLesson', () => {
  it('updates activeLessonId in the player', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const allLessons = useLearnerHubStore.getState().player!.course!.modules.flatMap((m) => m.lessons);
    const target = allLessons[allLessons.length - 1];

    useLearnerHubStore.getState().setActiveLesson(target.id);
    expect(useLearnerHubStore.getState().player?.activeLessonId).toBe(target.id);
  });
});

// ---------------------------------------------------------------------------
// markLessonComplete — demo enrollment
// ---------------------------------------------------------------------------
describe('markLessonComplete (demo enrollment)', () => {
  it('adds the lesson to completedLessonIds', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const player = useLearnerHubStore.getState().player!;
    const allLessons = player.course!.modules.flatMap((m) => m.lessons);
    const incomplete = allLessons.find((l) => !player.completedLessonIds.has(l.id));
    if (!incomplete) return;

    await useLearnerHubStore.getState().markLessonComplete(incomplete.id);
    const updatedPlayer = useLearnerHubStore.getState().player!;
    expect(updatedPlayer.completedLessonIds.has(incomplete.id)).toBe(true);
  });

  it('is idempotent — completing an already-complete lesson does not add duplicates', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    const alreadyDone = [...useLearnerHubStore.getState().player!.completedLessonIds][0];
    const sizeBefore = useLearnerHubStore.getState().player!.completedLessonIds.size;

    await useLearnerHubStore.getState().markLessonComplete(alreadyDone);
    const sizeAfter = useLearnerHubStore.getState().player!.completedLessonIds.size;
    expect(sizeAfter).toBe(sizeBefore);
  });
});

// ---------------------------------------------------------------------------
// clearPlayer
// ---------------------------------------------------------------------------
describe('clearPlayer', () => {
  it('resets player to null', async () => {
    await useLearnerHubStore.getState().loadCoursePlayer('demo-course-1', 'demo-enroll-1');
    useLearnerHubStore.getState().clearPlayer();
    expect(useLearnerHubStore.getState().player).toBeNull();
  });
});
