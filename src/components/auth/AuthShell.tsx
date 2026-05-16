import React from 'react';
import { BookOpen, Compass, Sparkles, Video } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SkillStreamLogo } from '../branding/SkillStreamLogo';

export function AuthShell({
  title,
  subtitle,
  children,
  asideTitle,
  asideText,
  footer,
  showAside = true,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  asideTitle?: string;
  asideText?: string;
  footer?: React.ReactNode;
  showAside?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafafe_0%,#f4f5fb_100%)] dark:bg-[linear-gradient(180deg,#0d1117_0%,#010409_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <ThemeToggle />
      <div className={`mx-auto grid max-w-6xl gap-6 ${showAside ? 'lg:grid-cols-2' : ''}`}>
        <div className={`edu-hero hidden lg:flex lg:flex-col lg:justify-between ${showAside ? '' : 'lg:hidden'}`}>
          <div className="relative z-10 space-y-6">
            <SkillStreamLogo to="/login" light subtitle="Education platform" />

            <div className="space-y-3">
              <span className="edu-pill w-fit text-white">SkillStream</span>
              <h1 className="edu-title max-w-lg text-3xl font-bold leading-tight text-white xl:text-4xl">
                Teach, learn, and connect in one focused learning platform.
              </h1>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            {[
              { icon: BookOpen, title: 'Courses', text: 'Build and access structured learning paths.' },
              { icon: Video, title: 'Live', text: 'Run sessions and replay them when needed.' },
              { icon: Sparkles, title: 'Practice', text: 'Track progress and focus where it matters.' },
              { icon: Compass, title: 'Community', text: 'Keep learners and teachers in sync.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[20px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <item.icon className="h-4 w-4 text-white" />
                <h3 className="mt-3 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs text-white/78">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="edu-card w-full max-w-xl p-6 sm:p-8">
            <div className="mb-8 space-y-3">
              <div className="lg:hidden">
                <SkillStreamLogo compact subtitle="Education platform" />
              </div>
              <h2 className="edu-title text-4xl font-bold text-[color:var(--edu-text)]">{title}</h2>
              <p className="text-sm edu-muted sm:text-base">{subtitle}</p>
              {asideText ? (
                <p className="rounded-2xl bg-[rgba(15,139,131,0.08)] p-4 text-sm text-[color:var(--edu-secondary)]">
                  {asideTitle ? `${asideTitle}. ${asideText}` : asideText}
                </p>
              ) : null}
            </div>

            {children}

            {footer ? <div className="mt-8 border-t border-[color:var(--edu-border)] pt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
