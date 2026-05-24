import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const TOUR_VERSION = 'v2';
const tourKey = (userId: string) => `ss_tour_${userId}_${TOUR_VERSION}`;
const PAD = 12;

interface Step {
  id: string;
  title: string;
  body: string;
  selector?: string;
}

const TEACHER_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to SkillStream',
    body: "Your private teaching workspace — built for teachers who run their own lessons. Let's take a 60-second tour so you can hit the ground running.",
  },
  {
    id: 'classes',
    title: 'Start with Classes',
    body: 'Create a class, generate a student invite link, and build your lesson schedule. Each class gets its own workspace with lessons, homework, resources, and messaging.',
    selector: 'a[href="/classes"]',
  },
  {
    id: 'schedule',
    title: 'Schedule your sessions',
    body: 'Add one-off lessons or set up a recurring weekly series. Reschedule or cancel individual sessions without affecting the rest.',
    selector: 'a[href="/schedule"]',
  },
  {
    id: 'students',
    title: 'Track your learners',
    body: 'See every student across every class. Monitor homework completion, progress, and last activity — all from one place.',
    selector: 'a[href="/students"]',
  },
  {
    id: 'messages',
    title: 'Stay in touch',
    body: 'Direct message individual students or send class-wide announcements. All communication stays inside the platform.',
    selector: 'a[href="/messages"]',
  },
  {
    id: 'payments',
    title: 'Manage payments',
    body: 'Log and track what students owe you. Keep your own payment records — full payment processing integration is coming soon.',
    selector: 'a[href="/payments"]',
  },
  {
    id: 'dashboard',
    title: 'Your home base',
    body: "The dashboard gives you an at-a-glance view of today's lessons, pending tasks, recent student activity, and AI-powered planning hints.",
    selector: 'a[href="/dashboard"]',
  },
  {
    id: 'ai',
    title: 'AI teaching tools built in',
    body: "Open any lesson card inside a class to access your AI tools: generate a full lesson plan, create a ready-to-use quiz, or get a session recap after a live class ends. When reviewing submitted homework you can also run AI feedback to help you grade faster.",
    selector: 'a[href="/classes"]',
  },
  {
    id: 'done',
    title: "You're all set.",
    body: 'Start by creating your first class. Your students join using the invite link you generate from the Classes page. Welcome aboard.',
  },
];

const STUDENT_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to SkillStream',
    body: "Your personal learning workspace. Here's a quick look at how it all works.",
  },
  {
    id: 'dashboard',
    title: 'Your home base',
    body: "The dashboard shows today's lessons, upcoming homework, your progress across classes, and AI study suggestions.",
    selector: 'a[href="/dashboard"]',
  },
  {
    id: 'classes',
    title: 'Your classes',
    body: 'Open any class to see lessons, assignments, class resources, and messages from your teacher.',
    selector: 'a[href="/classes"]',
  },
  {
    id: 'schedule',
    title: 'Your lesson calendar',
    body: 'See every upcoming session across all your classes. Never miss a lesson.',
    selector: 'a[href="/schedule"]',
  },
  {
    id: 'messages',
    title: 'Message your teachers',
    body: 'Quick questions, homework help, follow-ups — direct messages keep everything in one place.',
    selector: 'a[href="/messages"]',
  },
  {
    id: 'ai',
    title: 'AI writing assist',
    body: "Stuck on an assignment? When you submit homework, tap \"Get writing help\" for AI guidance — it will help you think through the problem and structure your answer, but the work stays yours.",
    selector: 'a[href="/classes"]',
  },
  {
    id: 'done',
    title: "You're ready.",
    body: 'Open your classes to see what is scheduled and get started with your learning.',
  },
];

function findVisible(selector: string): Element | null {
  const candidates = document.querySelectorAll(selector);
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export const OnboardingTour: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps = user?.role === 'STUDENT' ? STUDENT_STEPS : TEACHER_STEPS;
  const current = steps[step];
  const isAdmin = user?.role === 'ADMIN';
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const finish = useCallback(() => {
    if (user?.id) localStorage.setItem(tourKey(user.id), 'done');
    setVisible(false);
  }, [user?.id]);

  // Show tour on first login only (keyed per user so each account gets it once)
  useEffect(() => {
    if (!user?.id) return;
    if (localStorage.getItem(tourKey(user.id))) return;
    const t = window.setTimeout(() => setVisible(true), 450);
    return () => window.clearTimeout(t);
  }, [user?.id]);

  // Measure the spotlight target whenever step or visibility changes
  const measureSpot = useCallback(() => {
    if (!current.selector) { setSpotRect(null); return; }
    const el = findVisible(current.selector);
    if (!el) { setSpotRect(null); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setSpotRect(el.getBoundingClientRect());
  }, [current.selector]);

  useEffect(() => {
    if (!visible) return;
    // small delay to let smooth scroll settle
    const t = window.setTimeout(measureSpot, 100);
    return () => window.clearTimeout(t);
  }, [visible, measureSpot]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener('resize', measureSpot);
    return () => window.removeEventListener('resize', measureSpot);
  }, [visible, measureSpot]);

  if (!visible || !user || isAdmin) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(320, vw - 32);
  const cardEstH = 240;

  // Position the floating card near the spotlight
  let cardPos: React.CSSProperties = { width: cardW };
  if (spotRect) {
    const sTop = spotRect.top - PAD;
    const sBottom = spotRect.bottom + PAD;
    const sLeft = spotRect.left - PAD;
    const sRight = spotRect.right + PAD;

    if (vw - sRight >= cardW + 20) {
      // right of spotlight
      cardPos = { ...cardPos, top: Math.min(Math.max(spotRect.top, 16), vh - cardEstH - 16), left: sRight + 16 };
    } else if (sLeft >= cardW + 20) {
      // left of spotlight
      cardPos = { ...cardPos, top: Math.min(Math.max(spotRect.top, 16), vh - cardEstH - 16), left: sLeft - cardW - 16 };
    } else if (sTop >= cardEstH + 20) {
      // above spotlight
      cardPos = { ...cardPos, bottom: vh - sTop + 12, left: Math.min(Math.max(spotRect.left - 16, 16), vw - cardW - 16) };
    } else {
      // below spotlight
      cardPos = { ...cardPos, top: sBottom + 12, left: Math.min(Math.max(spotRect.left - 16, 16), vw - cardW - 16) };
    }
  } else {
    // centered
    cardPos = { ...cardPos, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const overlayColor = 'rgba(15,23,42,0.72)';

  return (
    <>
      {/* Backdrop — 4-quadrant cutout or solid */}
      {spotRect ? (
        <>
          <div style={{ position: 'fixed', inset: 0, bottom: 'auto', height: Math.max(0, spotRect.top - PAD), background: overlayColor, zIndex: 9998 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, top: spotRect.bottom + PAD, bottom: 0, background: overlayColor, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: spotRect.top - PAD, left: 0, width: Math.max(0, spotRect.left - PAD), height: spotRect.height + PAD * 2, background: overlayColor, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: spotRect.top - PAD, left: spotRect.right + PAD, right: 0, height: spotRect.height + PAD * 2, background: overlayColor, zIndex: 9998 }} />
          {/* Spotlight ring */}
          <div style={{
            position: 'fixed',
            top: spotRect.top - PAD - 2,
            left: spotRect.left - PAD - 2,
            width: spotRect.width + PAD * 2 + 4,
            height: spotRect.height + PAD * 2 + 4,
            borderRadius: 20,
            border: '2px solid var(--hub-primary)',
            boxShadow: '0 0 0 4px rgba(27,74,128,0.18), 0 0 32px rgba(27,74,128,0.22)',
            zIndex: 9999,
            pointerEvents: 'none',
          }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: overlayColor, zIndex: 9998 }} onClick={(e) => { if (e.target === e.currentTarget) finish(); }} />
      )}

      {/* Floating card */}
      <div
        ref={cardRef}
        style={{ position: 'fixed', zIndex: 10000, ...cardPos }}
        className="rounded-[28px] border border-[color:var(--hub-border)] bg-white shadow-[0_28px_72px_rgba(15,23,42,0.32)]"
      >
        <div className="p-6">
          {/* Progress dots */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 9999,
                    background: i <= step ? 'var(--hub-primary)' : 'var(--hub-border)',
                    opacity: i < step ? 0.4 : 1,
                    transition: 'all 0.25s',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={finish}
              aria-label="Skip tour"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--hub-muted)] transition hover:bg-[color:var(--hub-soft)] hover:text-[color:var(--hub-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">
            {isFirst ? 'Getting started' : isLast ? 'All done' : `Step ${step} of ${steps.length - 2}`}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--hub-text)]">
            {current.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--hub-muted)]">
            {current.body}
          </p>

          <div className="mt-5 flex items-center gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(27,74,128,0.3)] transition hover:opacity-90"
            >
              {isLast ? 'Get started' : isFirst ? 'Show me around' : 'Next'}
            </button>
            {!isFirst && !isLast ? (
              <button
                type="button"
                onClick={finish}
                className="ml-auto text-sm text-[color:var(--hub-muted)] transition hover:text-[color:var(--hub-text)]"
              >
                Skip
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
