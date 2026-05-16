import { create } from 'zustand';
import { Certificate, Course, CourseLesson, LearnerCourse, LearnerPath, LearnerPathCourse, OrgAnnouncement } from '../data/orgHub';
import { buildCertificateHtml } from '../lib/utils';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

// ─── Demo data ─────────────────────────────────────────────────────────────

const DEMO_LEARNER_COURSES: LearnerCourse[] = [
  {
    enrollmentId: 'demo-enroll-1',
    courseId: 'demo-course-1',
    title: 'Workplace Safety Fundamentals',
    description: 'Core health and safety procedures every employee must complete.',
    estimatedMinutes: 90,
    orgName: 'Acme Corp',
    enrolledAt: '2026-03-01T09:00:00.000Z',
    deadlineAt: '2026-06-01T09:00:00.000Z',
    completionPercent: 50,
    totalLessons: 4,
    completedLessons: 2,
    hasCertificate: false,
    isMandatory: true,
  },
  {
    enrollmentId: 'demo-enroll-2',
    courseId: 'demo-course-2',
    title: 'Data Privacy & GDPR Essentials',
    description: 'A practical guide to data protection law for business professionals.',
    estimatedMinutes: 60,
    orgName: 'Acme Corp',
    enrolledAt: '2026-03-01T09:00:00.000Z',
    completedAt: '2026-04-01T09:00:00.000Z',
    completionPercent: 100,
    totalLessons: 2,
    completedLessons: 2,
    hasCertificate: true,
    isMandatory: true,
  },
];

const DEMO_CERTIFICATES: Certificate[] = [
  {
    id: 'demo-cert-1',
    enrollmentId: 'demo-enroll-2',
    courseId: 'demo-course-2',
    courseTitle: 'Data Privacy & GDPR Essentials',
    orgName: 'Acme Corp',
    issuedAt: '2026-04-01T09:00:00.000Z',
  },
];

const DEMO_ANNOUNCEMENTS: OrgAnnouncement[] = [
  {
    id: 'demo-ann-1',
    orgId: 'demo-org',
    title: 'Welcome to SkillStream LMS',
    body: 'You have been enrolled in your onboarding learning path. Please complete the mandatory courses by your deadline.',
    isActive: true,
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 'demo-ann-2',
    orgId: 'demo-org',
    title: 'Compliance Reminder',
    body: 'All mandatory training must be completed by 1 June 2026. Please check your enrolled courses for deadlines.',
    isActive: true,
    createdAt: '2026-04-15T09:00:00.000Z',
  },
];

const DEMO_ENROLLED_PATHS: LearnerPath[] = [
  {
    pathId: 'demo-path-1',
    title: 'New Employee Onboarding',
    description: 'Everything new employees need to complete in their first 30 days.',
    enrolledAt: '2026-03-01T09:00:00.000Z',
    completionPercent: 50,
    courses: [
      {
        courseId: 'demo-course-1',
        courseTitle: 'Workplace Safety Fundamentals',
        position: 1,
        isUnlocked: true,
        completionPercent: 50,
        enrollmentId: 'demo-enroll-1',
        estimatedMinutes: 90,
      },
      {
        courseId: 'demo-course-2',
        courseTitle: 'Data Privacy & GDPR Essentials',
        position: 2,
        isUnlocked: true,
        completionPercent: 100,
        completedAt: '2026-04-01T09:00:00.000Z',
        enrollmentId: 'demo-enroll-2',
        estimatedMinutes: 60,
      },
    ],
  },
];

// ─── State ─────────────────────────────────────────────────────────────────

interface CoursePlayerState {
  course: Course | null;
  enrollmentId: string;
  completedLessonIds: Set<string>;
  activeLessonId: string | null;
}

interface LearnerHubState {
  enrolledCourses: LearnerCourse[];
  certificates: Certificate[];
  orgAnnouncements: OrgAnnouncement[];
  enrolledPaths: LearnerPath[];
  player: CoursePlayerState | null;
  isHydrated: boolean;
  isSyncing: boolean;
  isMarkingComplete: boolean;
  error: string | null;
}

interface LearnerHubActions {
  loadLearnerHub: (userId: string) => Promise<void>;
  loadCoursePlayer: (courseId: string, enrollmentId: string) => Promise<void>;
  setActiveLesson: (lessonId: string) => void;
  markLessonComplete: (lessonId: string, quizScore?: number) => Promise<void>;
  downloadCertificate: (certId: string, learnerName: string) => Promise<void>;
  clearPlayer: () => void;
}

type LearnerHubStore = LearnerHubState & LearnerHubActions;

// ─── Row types ─────────────────────────────────────────────────────────────

type EnrollmentRow = {
  id: string;
  course_id: string;
  org_id: string;
  enrolled_at: string;
  deadline_at: string | null;
  completed_at: string | null;
  is_mandatory: boolean;
  organizations: { name: string };
  courses: { id: string; title: string; description: string | null; thumbnail_url: string | null; estimated_minutes: number | null };
  lesson_completions: { lesson_id: string }[];
};

type AnnouncementRow = { id: string; org_id: string; title: string; body: string; is_active: boolean; created_at: string; expires_at: string | null };
type PathRow = { id: string; org_id: string; title: string; description: string; is_published: boolean; created_at: string; updated_at: string };
type PathCourseRow = { id: string; path_id: string; course_id: string; position: number; courses: { title: string; estimated_minutes: number | null } | null };

type CourseModuleRow = { id: string; course_id: string; title: string; position: number };
type CourseLessonRow = {
  id: string; module_id: string; title: string; kind: string; position: number;
  content_body: string | null; video_url: string | null; duration_minutes: number | null;
  quiz_questions: unknown; quiz_pass_score: number;
};
type CertRow = {
  id: string; enrollment_id: string; issued_at: string; certificate_url: string | null;
  course_enrollments: { course_id: string; organizations: { name: string }; courses: { title: string } };
};

// ─── Store ─────────────────────────────────────────────────────────────────

export const useLearnerHubStore = create<LearnerHubStore>((set, get) => ({
  enrolledCourses: [],
  certificates: [],
  orgAnnouncements: [],
  enrolledPaths: [],
  player: null,
  isHydrated: false,
  isSyncing: false,
  isMarkingComplete: false,
  error: null,

  loadLearnerHub: async (userId: string) => {
    set({ isSyncing: true, error: null });

    if (userId.startsWith('demo-learner')) {
      set({
        enrolledCourses: DEMO_LEARNER_COURSES,
        certificates: DEMO_CERTIFICATES,
        orgAnnouncements: DEMO_ANNOUNCEMENTS,
        enrolledPaths: DEMO_ENROLLED_PATHS,
        isHydrated: true,
        isSyncing: false,
      });
      return;
    }

    if (!hasSupabaseConfig) {
      set({ isSyncing: false, isHydrated: true });
      return;
    }

    try {
      const [enrollmentsRes, certsRes] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('id, course_id, org_id, enrolled_at, deadline_at, completed_at, is_mandatory, organizations(name), courses(id, title, description, thumbnail_url, estimated_minutes), lesson_completions(lesson_id)')
          .eq('user_id', userId),
        supabase
          .from('certificates')
          .select('id, enrollment_id, issued_at, certificate_url, course_enrollments(course_id, organizations(name), courses(title))')
          .eq('course_enrollments.user_id', userId),
      ]);

      const enrollmentRows = (enrollmentsRes.data || []) as unknown as EnrollmentRow[];

      // For each enrollment we need total lesson count — batch fetch all course module/lesson counts
      const courseIds = [...new Set(enrollmentRows.map((r) => r.course_id))];
      const totalLessonsMap: Record<string, number> = {};

      if (courseIds.length > 0) {
        const modsRes = await supabase.from('course_modules').select('id, course_id').in('course_id', courseIds);
        const moduleRows = (modsRes.data || []) as { id: string; course_id: string }[];
        const moduleIds = moduleRows.map((m) => m.id);
        if (moduleIds.length > 0) {
          const lessonsRes = await supabase.from('course_lessons').select('id, module_id').in('module_id', moduleIds);
          const lessonRows = (lessonsRes.data || []) as { id: string; module_id: string }[];
          courseIds.forEach((cid) => {
            const courseMods = moduleRows.filter((m) => m.course_id === cid);
            const modIds = courseMods.map((m) => m.id);
            totalLessonsMap[cid] = lessonRows.filter((l) => modIds.includes(l.module_id)).length;
          });
        }
      }

      const enrolledCourses: LearnerCourse[] = enrollmentRows.map((row) => {
        const c = row.courses as { id: string; title: string; description: string | null; thumbnail_url: string | null; estimated_minutes: number | null };
        const total = totalLessonsMap[row.course_id] ?? 0;
        const completed = row.lesson_completions?.length ?? 0;
        return {
          enrollmentId: row.id,
          courseId: row.course_id,
          title: c?.title || '',
          description: c?.description || '',
          thumbnailUrl: c?.thumbnail_url || undefined,
          estimatedMinutes: c?.estimated_minutes || undefined,
          orgName: (row.organizations as { name: string })?.name || '',
          enrolledAt: row.enrolled_at,
          deadlineAt: row.deadline_at || undefined,
          completedAt: row.completed_at || undefined,
          completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
          totalLessons: total,
          completedLessons: completed,
          hasCertificate: Boolean(row.completed_at),
          isMandatory: Boolean(row.is_mandatory),
        };
      });

      const certRows = (certsRes.data || []) as unknown as CertRow[];
      const certificates: Certificate[] = certRows.map((row) => {
        const ce = row.course_enrollments as { course_id: string; organizations: { name: string }; courses: { title: string } };
        return {
          id: row.id,
          enrollmentId: row.enrollment_id,
          courseId: ce?.course_id || '',
          courseTitle: (ce?.courses as { title: string })?.title || '',
          orgName: (ce?.organizations as { name: string })?.name || '',
          issuedAt: row.issued_at,
          certificateUrl: row.certificate_url || undefined,
        };
      });

      // Fetch announcements and paths for the learner's orgs
      const orgIds = [...new Set(enrollmentRows.map((r) => r.org_id).filter(Boolean))];
      let orgAnnouncements: OrgAnnouncement[] = [];
      let enrolledPaths: LearnerPath[] = [];

      if (orgIds.length > 0) {
        const now = new Date().toISOString();
        const [annRes, pathsRes] = await Promise.all([
          supabase.from('org_announcements').select('*').in('org_id', orgIds).eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`),
          supabase.from('learning_paths').select('id, org_id, title, description, is_published, created_at, updated_at').in('org_id', orgIds).eq('is_published', true),
        ]);

        orgAnnouncements = ((annRes.data || []) as AnnouncementRow[]).map((r) => ({
          id: r.id, orgId: r.org_id, title: r.title, body: r.body,
          isActive: r.is_active, createdAt: r.created_at, expiresAt: r.expires_at || undefined,
        }));

        const pathRows = (pathsRes.data || []) as PathRow[];
        if (pathRows.length > 0) {
          const pathIds = pathRows.map((p) => p.id);
          const pathCoursesRes = await supabase
            .from('learning_path_courses')
            .select('id, path_id, course_id, position, courses(title, estimated_minutes)')
            .in('path_id', pathIds)
            .order('position');
          const pathCourseRows = ((pathCoursesRes.data || []) as unknown as PathCourseRow[]);

          enrolledPaths = pathRows.map((path) => {
            const pathCourses = pathCourseRows.filter((pc) => pc.path_id === path.id).sort((a, b) => a.position - b.position);
            let completedCount = 0;
            const courses: LearnerPathCourse[] = pathCourses.map((pc, idx) => {
              const enroll = enrolledCourses.find((e) => e.courseId === pc.course_id);
              const prevCompleted = idx === 0 || pathCourses.slice(0, idx).every((p) => enrolledCourses.find((e) => e.courseId === p.course_id)?.completedAt);
              if (enroll?.completedAt) completedCount++;
              return {
                courseId: pc.course_id,
                courseTitle: pc.courses?.title || '',
                position: pc.position,
                isUnlocked: Boolean(enroll) && prevCompleted,
                completionPercent: enroll?.completionPercent ?? 0,
                completedAt: enroll?.completedAt,
                enrollmentId: enroll?.enrollmentId,
                estimatedMinutes: pc.courses?.estimated_minutes || undefined,
              };
            });
            return {
              pathId: path.id,
              title: path.title,
              description: path.description,
              enrolledAt: path.created_at,
              completionPercent: pathCourses.length > 0 ? Math.round((completedCount / pathCourses.length) * 100) : 0,
              completedAt: completedCount === pathCourses.length && pathCourses.length > 0 ? new Date().toISOString() : undefined,
              courses,
            };
          });
        }
      }

      set({ enrolledCourses, certificates, orgAnnouncements, enrolledPaths, isHydrated: true, isSyncing: false, error: null });
    } catch (error) {
      set({ isSyncing: false, isHydrated: true, error: error instanceof Error ? error.message : 'Failed to load learning data.' });
    }
  },

  loadCoursePlayer: async (courseId: string, enrollmentId: string) => {
    set({ error: null });

    // Demo mode
    if (enrollmentId.startsWith('demo-enroll')) {
      // Import demo courses from orgHub store to avoid duplication
      await import('./orgHub');

      // Build a minimal demo course inline
      const demoCourse: Course = {
        id: courseId,
        orgId: 'demo-org',
        createdByUserId: 'demo-orgadmin',
        title: enrollmentId === 'demo-enroll-1' ? 'Workplace Safety Fundamentals' : 'Data Privacy & GDPR Essentials',
        description: '',
        isPublished: true,
        modules: enrollmentId === 'demo-enroll-1' ? [
          { id: 'demo-mod-1', courseId, title: 'Introduction', position: 1, lessons: [
            { id: 'demo-lesson-1', moduleId: 'demo-mod-1', title: 'Welcome & Course Overview', kind: 'video', position: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', durationMinutes: 5, quizPassScore: 80 },
            { id: 'demo-lesson-2', moduleId: 'demo-mod-1', title: 'Why Safety Matters', kind: 'text', position: 2, contentBody: 'Workplace safety is the responsibility of every employee. This module covers the core principles you need to know to stay safe and keep your colleagues safe.', quizPassScore: 80 },
          ]},
          { id: 'demo-mod-2', courseId, title: 'Emergency Procedures', position: 2, lessons: [
            { id: 'demo-lesson-3', moduleId: 'demo-mod-2', title: 'Fire Safety', kind: 'text', position: 1, contentBody: 'In the event of a fire, activate the nearest alarm, evacuate via the nearest exit, and assemble at the designated muster point.', quizPassScore: 80 },
            { id: 'demo-lesson-4', moduleId: 'demo-mod-2', title: 'Safety Knowledge Check', kind: 'quiz', position: 2, quizPassScore: 80,
              quizQuestions: [
                { question: 'What is the first thing to do in a fire emergency?', options: ['Call your manager', 'Activate the nearest alarm', 'Pack your belongings', 'Use the elevator'], correctIndex: 1, explanation: 'Always activate the alarm first to alert everyone in the building.' },
                { question: 'Where should you assemble after evacuating?', options: ['Nearest car park', 'Designated muster point', 'Reception area', 'Nearest coffee shop'], correctIndex: 1 },
              ]},
          ]},
        ] : [
          { id: 'demo-mod-3', courseId, title: 'GDPR Fundamentals', position: 1, lessons: [
            { id: 'demo-lesson-5', moduleId: 'demo-mod-3', title: 'What is GDPR?', kind: 'text', position: 1, contentBody: 'The General Data Protection Regulation (GDPR) is a legal framework that sets guidelines for the collection and processing of personal information from individuals within the EU.', quizPassScore: 80 },
            { id: 'demo-lesson-6', moduleId: 'demo-mod-3', title: 'Key Principles', kind: 'video', position: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', durationMinutes: 8, quizPassScore: 80 },
          ]},
        ],
        createdAt: '2026-01-01T09:00:00.000Z',
        updatedAt: '2026-01-01T09:00:00.000Z',
      };

      const completedIds = enrollmentId === 'demo-enroll-1'
        ? new Set(['demo-lesson-1', 'demo-lesson-2'])
        : new Set(['demo-lesson-5', 'demo-lesson-6']);

      const firstLesson = demoCourse.modules[0]?.lessons[0];
      const firstIncomplete = demoCourse.modules.flatMap((m) => m.lessons).find((l) => !completedIds.has(l.id));

      set({
        player: {
          course: demoCourse,
          enrollmentId,
          completedLessonIds: completedIds,
          activeLessonId: (firstIncomplete ?? firstLesson)?.id ?? null,
        },
      });
      return;
    }

    if (!hasSupabaseConfig) return;

    try {
      const [courseRes, completionsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lesson_completions').select('lesson_id').eq('enrollment_id', enrollmentId),
      ]);

      if (courseRes.error || !courseRes.data) throw new Error('Could not load course.');

      const modsRes = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('position');
      const modules = (modsRes.data || []) as CourseModuleRow[];
      const moduleIds = modules.map((m) => m.id);

      let lessons: CourseLessonRow[] = [];
      if (moduleIds.length > 0) {
        const lessonsRes = await supabase.from('course_lessons').select('*').in('module_id', moduleIds).order('position');
        lessons = (lessonsRes.data || []) as CourseLessonRow[];
      }

      const course: Course = {
        id: courseRes.data.id as string,
        orgId: (courseRes.data.org_id as string | null) || undefined,
        createdByUserId: courseRes.data.created_by_user_id as string,
        title: courseRes.data.title as string,
        description: (courseRes.data.description as string | null) || '',
        thumbnailUrl: (courseRes.data.thumbnail_url as string | null) || undefined,
        isPublished: courseRes.data.is_published as boolean,
        estimatedMinutes: (courseRes.data.estimated_minutes as number | null) || undefined,
        createdAt: courseRes.data.created_at as string,
        updatedAt: courseRes.data.updated_at as string,
        modules: modules.map((m) => ({
          id: m.id,
          courseId: m.course_id,
          title: m.title,
          position: m.position,
          lessons: lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.position - b.position).map((l): CourseLesson => ({
            id: l.id,
            moduleId: l.module_id,
            title: l.title,
            kind: l.kind as CourseLesson['kind'],
            position: l.position,
            contentBody: l.content_body || undefined,
            videoUrl: l.video_url || undefined,
            durationMinutes: l.duration_minutes || undefined,
            quizQuestions: Array.isArray(l.quiz_questions) ? l.quiz_questions as CourseLesson['quizQuestions'] : undefined,
            quizPassScore: l.quiz_pass_score ?? 80,
          })),
        })),
      };

      const completedLessonIds = new Set(((completionsRes.data || []) as { lesson_id: string }[]).map((r) => r.lesson_id));
      const allLessons = course.modules.flatMap((m) => m.lessons);
      const firstIncomplete = allLessons.find((l) => !completedLessonIds.has(l.id));

      set({
        player: {
          course,
          enrollmentId,
          completedLessonIds,
          activeLessonId: (firstIncomplete ?? allLessons[0])?.id ?? null,
        },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load course.' });
    }
  },

  setActiveLesson: (lessonId) => {
    const { player } = get();
    if (!player) return;
    set({ player: { ...player, activeLessonId: lessonId } });
  },

  markLessonComplete: async (lessonId, quizScore?) => {
    const { player, enrolledCourses } = get();
    if (!player) return;

    set({ isMarkingComplete: true });

    // Optimistic update
    const newCompleted = new Set(player.completedLessonIds);
    newCompleted.add(lessonId);
    const allLessons = player.course?.modules.flatMap((m) => m.lessons) ?? [];
    const total = allLessons.length;
    const completedCount = newCompleted.size;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Advance to next lesson
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    const nextLesson = allLessons[currentIndex + 1] ?? null;

    set({
      player: { ...player, completedLessonIds: newCompleted, activeLessonId: nextLesson?.id ?? player.activeLessonId },
      enrolledCourses: enrolledCourses.map((ec) =>
        ec.enrollmentId === player.enrollmentId
          ? { ...ec, completedLessons: completedCount, completionPercent: percent, completedAt: percent === 100 ? new Date().toISOString() : ec.completedAt, hasCertificate: percent === 100 }
          : ec
      ),
      isMarkingComplete: false,
    });

    // Demo: skip Supabase
    if (player.enrollmentId.startsWith('demo-enroll')) return;

    if (!hasSupabaseConfig) return;

    try {
      await supabase.from('lesson_completions').upsert({
        lesson_id: lessonId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        enrollment_id: player.enrollmentId,
        quiz_score: quizScore ?? null,
      }, { onConflict: 'lesson_id,user_id' });
    } catch { /* completion already handled optimistically */ }
  },

  downloadCertificate: async (certId, learnerName) => {
    const { certificates } = get();
    const cert = certificates.find((c) => c.id === certId);
    if (!cert) return;

    if (cert.certificateUrl) {
      const a = document.createElement('a');
      a.href = cert.certificateUrl;
      a.download = `certificate-${cert.courseTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const triggerDownload = (url: string, filename: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    const buildAndDownload = () => {
      const html = buildCertificateHtml({
        learnerName,
        courseTitle: cert.courseTitle,
        orgName: cert.orgName,
        issuedAt: new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
      const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const filename = `certificate-${cert.courseTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
      triggerDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    };

    if (certId.startsWith('demo-') || !hasSupabaseConfig) {
      buildAndDownload();
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', { body: { certId } });
      if (error || !data?.url) throw new Error();
      const url = data.url as string;
      triggerDownload(url, `certificate-${cert.courseTitle.replace(/\s+/g, '-').toLowerCase()}.html`);
      set((s) => ({ certificates: s.certificates.map((c) => c.id === certId ? { ...c, certificateUrl: url } : c) }));
    } catch {
      buildAndDownload();
    }
  },

  clearPlayer: () => set({ player: null }),
}));
