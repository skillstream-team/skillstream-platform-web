import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, FileText, GraduationCap, Radio, Star, Video } from 'lucide-react';
import { useLearnerHubStore } from '../../store/learnerHub';
import { useOrgHubStore } from '../../store/orgHub';
import { useAuthStore } from '../../store/auth';
import type { CourseLesson, CourseLessonKind, QuizQuestion as QuizQuestionData } from '../../data/orgHub';
import { cn } from '../../lib/utils';

const KIND_ICONS: Record<CourseLessonKind, React.ElementType> = {
  text: FileText,
  video: Video,
  quiz: GraduationCap,
  live: Radio,
};

export const CoursePlayerPage: React.FC = () => {
  const { courseId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const enrollmentId = searchParams.get('enrollment') ?? '';
  const { player, loadCoursePlayer, setActiveLesson, markLessonComplete, isMarkingComplete } = useLearnerHubStore();
  const { submitCourseRating } = useOrgHubStore();
  const { user } = useAuthStore();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasShownRatingModal, setHasShownRatingModal] = useState(false);

  const handleMarkComplete = async (lessonId: string, score?: number) => {
    await markLessonComplete(lessonId, score);
    const { player: updatedPlayer } = useLearnerHubStore.getState();
    if (!updatedPlayer) return;
    const allLessons = updatedPlayer.course?.modules.flatMap((m) => m.lessons) ?? [];
    const allDone = allLessons.length > 0 && allLessons.every((l) => updatedPlayer.completedLessonIds.has(l.id));
    if (allDone && !hasShownRatingModal) {
      setHasShownRatingModal(true);
      setShowRatingModal(true);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingStars || !player?.course) return;
    try {
      setIsSubmittingRating(true);
      await submitCourseRating({
        courseId: player.course.id,
        enrollmentId,
        orgId: player.course.orgId ?? '',
        rating: ratingStars,
        comment: ratingComment.trim() || undefined,
        learnerName: user?.name ?? user?.email ?? 'Learner',
      });
      setShowRatingModal(false);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (courseId && enrollmentId) void loadCoursePlayer(courseId, enrollmentId);
  }, [courseId, enrollmentId, loadCoursePlayer]);

  if (!player) {
    return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  }

  const { course, completedLessonIds, activeLessonId } = player;
  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? null;
  const activeModule = course?.modules.find((m) => m.lessons.some((l) => l.id === activeLessonId)) ?? null;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => navigate('/learn')} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">
        <ArrowLeft className="h-4 w-4" /> Back to my learning
      </button>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        {/* Left sidebar — module/lesson nav */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">{course?.title}</p>
          <div className="space-y-3">
            {course?.modules.map((module) => (
              <div key={module.id}>
                <p className="px-2 py-1 text-xs font-semibold text-[color:var(--hub-muted)]">{module.title}</p>
                <div className="space-y-0.5">
                  {module.lessons.map((lesson) => {
                    const isDone = completedLessonIds.has(lesson.id);
                    const isActive = lesson.id === activeLessonId;
                    const LIcon = KIND_ICONS[lesson.kind];
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLesson(lesson.id)}
                        className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition', isActive ? 'bg-[color:var(--hub-primary)] text-white' : 'hover:bg-[color:var(--hub-soft)]')}
                      >
                        {isDone
                          ? <CheckCircle className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-emerald-500')} />
                          : <Circle className={cn('h-4 w-4 shrink-0', isActive ? 'text-white/60' : 'text-[color:var(--hub-muted)]')} />}
                        <LIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-sm">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — lesson content */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          {!activeLesson ? (
            <div className="flex h-64 items-center justify-center text-sm text-[color:var(--hub-muted)]">Select a lesson to start.</div>
          ) : (
            <LessonViewer
              lesson={activeLesson}
              moduleTitle={activeModule?.title ?? ''}
              isCompleted={completedLessonIds.has(activeLesson.id)}
              isMarkingComplete={isMarkingComplete}
              onMarkComplete={(score) => handleMarkComplete(activeLesson.id, score)}
            />
          )}
        </div>
      </div>

      {showRatingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--hub-text)]">Course complete!</h3>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">How would you rate this course?</p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRatingStars(star)} className="rounded-full p-1 transition hover:scale-110">
                  <Star className={cn('h-8 w-8 transition', star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-[color:var(--hub-border)]')} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Leave a comment (optional)"
              rows={3}
              className="mt-4 w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none resize-none"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowRatingModal(false)} className="flex-1 rounded-full border border-[color:var(--hub-border)] py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">
                Skip
              </button>
              <button type="button" onClick={handleSubmitRating} disabled={!ratingStars || isSubmittingRating} className="flex-1 rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmittingRating ? 'Submitting...' : 'Submit rating'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface LessonViewerProps {
  lesson: CourseLesson;
  moduleTitle: string;
  isCompleted: boolean;
  isMarkingComplete: boolean;
  onMarkComplete: (score?: number) => Promise<void>;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, moduleTitle, isCompleted, isMarkingComplete, onMarkComplete }) => {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
  }, [lesson.id]);

  const handleSubmitQuiz = async () => {
    if (!lesson.quizQuestions) return;
    const correct = lesson.quizQuestions.filter((q, i) => quizAnswers[i] === q.correctIndex).length;
    const score = Math.round((correct / lesson.quizQuestions.length) * 100);
    const passed = score >= (lesson.quizPassScore ?? 80);
    setQuizSubmitted(true);
    setQuizPassed(passed);
    if (passed) await onMarkComplete(score);
  };

  const allAnswered = lesson.quizQuestions ? lesson.quizQuestions.every((_, i) => quizAnswers[i] !== undefined) : false;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{moduleTitle}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">{lesson.title}</h2>
      </div>

      {lesson.kind === 'text' ? (
        <div className="prose prose-sm max-w-none leading-relaxed text-[color:var(--hub-text)]">
          {lesson.contentBody?.split('\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      ) : null}

      {lesson.kind === 'video' && lesson.videoUrl ? (
        <video src={lesson.videoUrl} controls className="w-full rounded-2xl" />
      ) : null}

      {lesson.kind === 'quiz' && lesson.quizQuestions ? (
        <div className="space-y-6">
          {lesson.quizQuestions.map((q, qi) => (
            <QuizQuestion
              key={qi}
              question={q}
              index={qi}
              selectedAnswer={quizAnswers[qi]}
              submitted={quizSubmitted}
              onSelect={(answerIndex) => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: answerIndex }))}
            />
          ))}
          {quizSubmitted ? (
            <div className={cn('rounded-2xl p-4 text-sm font-semibold', quizPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
              {quizPassed ? `Quiz passed! Well done.` : `Not quite — you need ${lesson.quizPassScore ?? 80}% to pass. Review the material and try again.`}
            </div>
          ) : (
            <button type="button" onClick={handleSubmitQuiz} disabled={!allAnswered} className="rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              Submit answers
            </button>
          )}
        </div>
      ) : null}

      {lesson.kind !== 'quiz' && !isCompleted ? (
        <button type="button" onClick={() => onMarkComplete()} disabled={isMarkingComplete} className="rounded-full bg-[color:var(--hub-primary)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {isMarkingComplete ? 'Marking...' : 'Mark as complete'}
        </button>
      ) : null}

      {isCompleted ? (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle className="h-4 w-4" /> Lesson completed
        </div>
      ) : null}
    </div>
  );
};

const QuizQuestion: React.FC<{
  question: QuizQuestionData;
  index: number;
  selectedAnswer: number | undefined;
  submitted: boolean;
  onSelect: (i: number) => void;
}> = ({ question, index, selectedAnswer, submitted, onSelect }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{index + 1}. {question.question}</p>
      <div className="space-y-2">
        {question.options.map((opt, oi) => {
          const isCorrect = oi === question.correctIndex;
          const isSelected = oi === selectedAnswer;
          let bg = 'bg-[color:var(--hub-soft)] hover:bg-[color:var(--hub-border)]';
          if (submitted) {
            if (isCorrect) bg = 'bg-emerald-100 border-emerald-300';
            else if (isSelected && !isCorrect) bg = 'bg-red-100 border-red-300';
          } else if (isSelected) {
            bg = 'bg-[color:var(--hub-primary)] text-white';
          }
          return (
            <button
              key={oi}
              type="button"
              onClick={() => onSelect(oi)}
              disabled={submitted}
              className={cn('w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-left text-sm transition', bg)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && question.explanation ? (
        <p className="text-xs text-[color:var(--hub-muted)]"><span className="font-semibold">Explanation:</span> {question.explanation}</p>
      ) : null}
    </div>
  );
};
