import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Edit2, FileText, GraduationCap, Plus, Radio, Settings, Trash2, Video, X } from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { useOrgHubStore } from '../../store/orgHub';
import { CourseCategory, CourseDifficulty, CourseLesson, CourseLessonKind, QuizQuestion } from '../../data/orgHub';

const KIND_ICONS: Record<CourseLessonKind, React.ElementType> = {
  text: FileText,
  video: Video,
  quiz: GraduationCap,
  live: Radio,
};

const KIND_LABELS: Record<CourseLessonKind, string> = {
  text: 'Text',
  video: 'Video',
  quiz: 'Quiz',
  live: 'Live',
};

export const OrgCourseBuilderPage: React.FC = () => {
  const { orgId = '', courseId = '' } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { courses, loadOrgHub, isHydrated, updateCourse, addModule, updateModule, deleteModule, addLesson, updateLesson, deleteLesson } = useOrgHubStore();

  const course = courses.find((c) => c.id === courseId);

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isHydrated && orgId) void loadOrgHub(orgId);
  }, [orgId, isHydrated, loadOrgHub]);

  useEffect(() => {
    if (course && expandedModules.size === 0) {
      setExpandedModules(new Set(course.modules.map((m) => m.id)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  const activeLesson: CourseLesson | null = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === activeLessonId) ?? null;
  const activeLessonModule = course?.modules.find((m) => m.lessons.some((l) => l.id === activeLessonId));

  const handleAddModule = async () => {
    if (!course) return;
    try {
      const modId = await addModule(course.id, `Module ${course.modules.length + 1}`);
      setExpandedModules((prev) => new Set([...prev, modId]));
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Could not add module.', duration: 2500 });
    }
  };

  const handleAddLesson = async (moduleId: string, kind: CourseLessonKind) => {
    try {
      const lessonId = await addLesson(moduleId, { title: `New ${KIND_LABELS[kind]} lesson`, kind });
      setActiveLessonId(lessonId);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Could not add lesson.', duration: 2500 });
    }
  };

  const handleSaveLesson = async (data: Partial<CourseLesson>) => {
    if (!activeLessonId) return;
    try {
      setIsSaving(true);
      await updateLesson(activeLessonId, data);
      addNotification({ type: 'success', title: 'Saved', message: '', duration: 1200 });
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Could not save.', duration: 2500 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      await deleteLesson(moduleId, lessonId);
      if (activeLessonId === lessonId) setActiveLessonId(null);
    } catch { /* swallow */ }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule(course!.id, moduleId);
    } catch { /* swallow */ }
  };

  const handleSaveModuleTitle = async (moduleId: string) => {
    if (!editingModuleTitle.trim()) return;
    try {
      await updateModule(moduleId, editingModuleTitle.trim());
      setEditingModuleId(null);
    } catch { /* swallow */ }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    try {
      await updateCourse(course.id, { isPublished: !course.isPublished });
      addNotification({ type: 'success', title: course.isPublished ? 'Course unpublished' : 'Course published', message: '', duration: 1800 });
    } catch { /* swallow */ }
  };

  if (!isHydrated) {
    return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  }

  if (!course) {
    return <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center"><p className="text-sm text-[color:var(--hub-muted)]">Course not found.</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(`/org/${orgId}/courses`)} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </button>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${course.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]'}`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
          <button type="button" onClick={() => { setShowSettings((v) => !v); }} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold ${showSettings ? 'border-[color:var(--hub-primary)] bg-blue-50 text-[color:var(--hub-primary)]' : 'border-[color:var(--hub-border)] text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]'}`}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </button>
          <button type="button" onClick={handlePublishToggle} className="rounded-full border border-[color:var(--hub-border)] px-4 py-1.5 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
            {course.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        {/* Module/Lesson tree */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3 px-2 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">{course.title}</p>
            <button type="button" onClick={handleAddModule} aria-label="Add module" className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--hub-primary)] px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Add module
            </button>
          </div>

          <div className="space-y-2">
            {course.modules.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
                <p className="text-sm text-[color:var(--hub-muted)]">No modules yet.</p>
                <button type="button" onClick={handleAddModule} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" /> Add your first module
                </button>
              </div>
            ) : course.modules.map((module) => {
              const isExpanded = expandedModules.has(module.id);
              return (
                <div key={module.id}>
                  <div className="flex items-center gap-2 rounded-2xl px-2 py-2">
                    <button type="button" onClick={() => setExpandedModules((prev) => { const next = new Set(prev); isExpanded ? next.delete(module.id) : next.add(module.id); return next; })} className="flex flex-1 items-center gap-2 text-left">
                      {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--hub-muted)]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--hub-muted)]" />}
                      {editingModuleId === module.id ? (
                        <input
                          autoFocus
                          value={editingModuleTitle}
                          onChange={(e) => setEditingModuleTitle(e.target.value)}
                          onBlur={() => handleSaveModuleTitle(module.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveModuleTitle(module.id); if (e.key === 'Escape') setEditingModuleId(null); }}
                          className="flex-1 rounded-lg border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-2 py-1 text-sm outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{module.title}</span>
                      )}
                    </button>
                    <button type="button" onClick={() => { setEditingModuleId(module.id); setEditingModuleTitle(module.title); }} className="shrink-0 rounded-full p-1 text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDeleteModule(module.id)} className="shrink-0 rounded-full p-1 text-[color:var(--hub-muted)] hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="ml-6 space-y-1">
                      {module.lessons.map((lesson) => {
                        const LIcon = KIND_ICONS[lesson.kind];
                        const isActive = lesson.id === activeLessonId;
                        return (
                          <div key={lesson.id} className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${isActive ? 'bg-[color:var(--hub-primary)] text-white' : 'hover:bg-[color:var(--hub-soft)]'}`}>
                            <button type="button" onClick={() => { setActiveLessonId(lesson.id); setShowSettings(false); }} className="flex flex-1 items-center gap-2 text-left">
                              <LIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate text-sm">{lesson.title}</span>
                            </button>
                            <button type="button" onClick={() => handleDeleteLesson(module.id, lesson.id)} className={`shrink-0 rounded-full p-1 ${isActive ? 'hover:bg-white/20' : 'text-[color:var(--hub-muted)] hover:text-red-500'}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <div className="flex gap-1 pt-1">
                        {(['text', 'video', 'quiz'] as CourseLessonKind[]).map((kind) => {
                          const LIcon = KIND_ICONS[kind];
                          return (
                            <button key={kind} type="button" onClick={() => handleAddLesson(module.id, kind)} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hub-border)] px-2.5 py-1 text-xs font-semibold text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]">
                              <LIcon className="h-3 w-3" />
                              {KIND_LABELS[kind]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lesson editor / course settings */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          {showSettings || !activeLesson ? (
            <CourseSettingsEditor
              course={course}
              onSave={async (data) => {
                try {
                  setIsSaving(true);
                  await updateCourse(course.id, data);
                  addNotification({ type: 'success', title: 'Saved', message: '', duration: 1200 });
                  setShowSettings(false);
                } catch (err) {
                  addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not save.', duration: 2500 });
                } finally { setIsSaving(false); }
              }}
              isSaving={isSaving}
              onBack={activeLesson ? () => setShowSettings(false) : undefined}
            />
          ) : (
            <LessonEditor
              lesson={activeLesson}
              moduleTitle={activeLessonModule?.title ?? ''}
              onSave={handleSaveLesson}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface CourseSettingsEditorProps {
  course: import('../../data/orgHub').Course;
  onSave: (data: { category?: CourseCategory; difficulty?: CourseDifficulty; estimatedMinutes?: number; thumbnailUrl?: string; skills?: string[] }) => Promise<void>;
  isSaving: boolean;
  onBack?: () => void;
}

const CourseSettingsEditor: React.FC<CourseSettingsEditorProps> = ({ course, onSave, isSaving, onBack }) => {
  const [category, setCategory] = useState<CourseCategory | ''>(course.category ?? '');
  const [difficulty, setDifficulty] = useState<CourseDifficulty | ''>(course.difficulty ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(course.estimatedMinutes?.toString() ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(course.skills ?? []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSave = () => void onSave({
    category: category || undefined,
    difficulty: difficulty || undefined,
    estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    skills,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Course Settings</p>
        {onBack ? <button type="button" onClick={onBack} className="text-xs text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">← Back to lesson</button> : null}
      </div>

      <div className="grid gap-4 max-w-lg">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as CourseCategory | '')} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none capitalize">
            <option value="">No category</option>
            {(['compliance', 'leadership', 'technical', 'soft-skills', 'onboarding', 'health-safety', 'other'] as CourseCategory[]).map((c) => (
              <option key={c} value={c}>{c.replace('-', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as CourseDifficulty | '')} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
            <option value="">No difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Estimated duration (minutes)</label>
          <input value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} type="number" min="1" placeholder="e.g. 45" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Thumbnail URL</label>
          <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
          {thumbnailUrl ? <img src={thumbnailUrl} alt="Thumbnail" className="mt-2 h-20 w-auto rounded-2xl object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Skills taught</label>
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Type skill and press Enter" className="flex-1 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2.5 text-sm outline-none" />
            <button type="button" onClick={addSkill} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">Add</button>
          </div>
          {skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 rounded-full bg-indigo-50 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="rounded-full hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <button type="button" onClick={handleSave} disabled={isSaving} className="justify-self-start rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

interface LessonEditorProps {
  lesson: CourseLesson;
  moduleTitle: string;
  onSave: (data: Partial<CourseLesson>) => Promise<void>;
  isSaving: boolean;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, moduleTitle, onSave, isSaving }) => {
  const [title, setTitle] = useState(lesson.title);
  const [contentBody, setContentBody] = useState(lesson.contentBody ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '');
  const [durationMinutes, setDurationMinutes] = useState(lesson.durationMinutes?.toString() ?? '');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(lesson.quizQuestions ?? []);
  const [passScore, setPassScore] = useState(lesson.quizPassScore?.toString() ?? '80');

  useEffect(() => {
    setTitle(lesson.title);
    setContentBody(lesson.contentBody ?? '');
    setVideoUrl(lesson.videoUrl ?? '');
    setDurationMinutes(lesson.durationMinutes?.toString() ?? '');
    setQuizQuestions(lesson.quizQuestions ?? []);
    setPassScore(lesson.quizPassScore?.toString() ?? '80');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const handleSave = () => {
    const data: Partial<CourseLesson> = { title };
    if (lesson.kind === 'text') data.contentBody = contentBody;
    if (lesson.kind === 'video') { data.videoUrl = videoUrl; data.durationMinutes = durationMinutes ? parseInt(durationMinutes) : undefined; }
    if (lesson.kind === 'quiz') { data.quizQuestions = quizQuestions; data.quizPassScore = parseInt(passScore) || 80; }
    void onSave(data);
  };

  const addQuestion = () => {
    setQuizQuestions((prev) => [...prev, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const updateQuestion = (index: number, update: Partial<QuizQuestion>) => {
    setQuizQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...update } : q)));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuizQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q));
  };

  const removeQuestion = (index: number) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const LIcon = KIND_ICONS[lesson.kind];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{moduleTitle} · <span className="inline-flex items-center gap-1"><LIcon className="inline h-3 w-3" /> {KIND_LABELS[lesson.kind]}</span></p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-base font-semibold outline-none"
          placeholder="Lesson title"
        />
      </div>

      {lesson.kind === 'text' ? (
        <textarea
          value={contentBody}
          onChange={(e) => setContentBody(e.target.value)}
          rows={10}
          placeholder="Write your lesson content here..."
          className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
        />
      ) : null}

      {lesson.kind === 'video' ? (
        <div className="space-y-3">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video URL (YouTube, Vimeo, direct MP4)"
            className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
          />
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full rounded-2xl" />
          ) : null}
          <input
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="Duration in minutes"
            type="number"
            min="1"
            className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
          />
        </div>
      ) : null}

      {lesson.kind === 'quiz' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Questions</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[color:var(--hub-muted)]">Pass score</label>
              <input value={passScore} onChange={(e) => setPassScore(e.target.value)} type="number" min="0" max="100" className="w-16 rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-2 py-1.5 text-sm outline-none" />
              <span className="text-xs text-[color:var(--hub-muted)]">%</span>
            </div>
          </div>
          {quizQuestions.map((q, qi) => (
            <div key={qi} className="rounded-2xl border border-[color:var(--hub-border)] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <input value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} placeholder={`Question ${qi + 1}`} className="flex-1 rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-2 text-sm outline-none" />
                <button type="button" onClick={() => removeQuestion(qi)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, { correctIndex: oi })} className="accent-[color:var(--hub-primary)]" />
                    <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-2 text-sm outline-none" />
                  </div>
                ))}
              </div>
              <input value={q.explanation ?? ''} onChange={(e) => updateQuestion(qi, { explanation: e.target.value })} placeholder="Explanation (optional — shown after answering)" className="w-full rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-2 text-sm outline-none" />
            </div>
          ))}
          <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]">
            <Plus className="h-4 w-4" /> Add question
          </button>
        </div>
      ) : null}

      {lesson.kind === 'live' ? (
        <div className="rounded-2xl bg-[color:var(--hub-soft)] px-4 py-5 text-sm text-[color:var(--hub-muted)]">
          Live lessons are linked to sessions scheduled in your class calendar. Use the Schedule page to create and manage live session times.
        </div>
      ) : null}

      <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {isSaving ? 'Saving...' : 'Save lesson'}
      </button>
    </div>
  );
};
