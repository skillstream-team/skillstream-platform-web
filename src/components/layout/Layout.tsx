import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CreditCard, Home, LogOut, MessageSquare, Monitor, Moon, MoreHorizontal, RotateCcw, Settings, ShieldCheck, Sun, UserCircle, Users, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SkillStreamLogo } from '../branding/SkillStreamLogo';
import { OnboardingTour } from '../tour/OnboardingTour';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { useAuthStore } from '../../store/auth';
import { getInitials } from '../../lib/utils';
import { useTeacherHubStore } from '../../store/teacherHub';
import { useThemeStore } from '../../store/theme';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  useRealtimeMessages();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const undoItem = useTeacherHubStore((state) => state.undoItem);
  const undoLastAction = useTeacherHubStore((state) => state.undoLastAction);
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const studentSelf = useTeacherHubStore((state) =>
    isStudent ? state.students.find((s) => s.email.toLowerCase() === (user?.email || '').toLowerCase()) : undefined
  );

  const visibleNavItems = useMemo(() => {
    if (isStudent) {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: Home },
        { to: '/classes', label: 'My Classes', icon: BookOpen },
        { to: '/schedule', label: 'Schedule', icon: CalendarDays },
        { to: '/messages', label: 'Messages', icon: MessageSquare },
        ...(studentSelf ? [{ to: `/students/${studentSelf.id}`, label: 'My Profile', icon: UserCircle }] : []),
        { to: '/settings', label: 'Settings', icon: Settings },
      ];
    }
    const teacherAdminItems = [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/classes', label: 'Classes', icon: BookOpen },
      { to: '/students', label: 'Students', icon: Users },
      { to: '/schedule', label: 'Schedule', icon: CalendarDays },
      { to: '/messages', label: 'Messages', icon: MessageSquare },
      { to: '/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin', label: 'Admin', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
    if (isTeacher) return teacherAdminItems.filter((item) => item.to !== '/admin');
    return teacherAdminItems;
  }, [isStudent, isTeacher, studentSelf]);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const { mobilePrimaryItems, mobileOverflowItems } = useMemo(() => {
    if (visibleNavItems.length <= 5) {
      return { mobilePrimaryItems: visibleNavItems, mobileOverflowItems: [] as typeof visibleNavItems };
    }
    return {
      mobilePrimaryItems: visibleNavItems.slice(0, 4),
      mobileOverflowItems: visibleNavItems.slice(4),
    };
  }, [visibleNavItems]);
  const isMoreActive = mobileOverflowItems.some((item) => location.pathname.startsWith(item.to));

  useEffect(() => {
    setShowMobileMore(false);
  }, [location.pathname]);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
    <div className="min-h-screen bg-[color:var(--hub-bg)] text-[color:var(--hub-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-0 lg:px-6 lg:py-6">
        <aside className="hidden w-[280px] shrink-0 lg:flex lg:flex-col">
          <div className="flex h-full flex-col rounded-[32px] border border-[color:var(--hub-border)] bg-[color:var(--hub-panel)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <SkillStreamLogo to="/dashboard" hideMark />

            <nav className="mt-8 grid gap-2">
              {visibleNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[color:var(--hub-primary)] text-white shadow-[0_12px_24px_rgba(27,74,128,0.24)]'
                        : 'text-[color:var(--hub-muted)] hover:bg-white hover:text-[color:var(--hub-text)]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}

            </nav>

            <div className="mt-auto rounded-[24px] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-sm font-bold text-white">
                  {getInitials(user.name || user.email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name || 'SkillStream User'}</p>
                  <p className="truncate text-xs text-[color:var(--hub-muted)]">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] transition hover:bg-[color:var(--hub-soft)] hover:text-[color:var(--hub-text)]"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'light' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center border-b border-[color:var(--hub-border)] bg-[color:var(--hub-panel)] px-4 py-3 backdrop-blur-xl lg:hidden">
            <SkillStreamLogo to="/dashboard" hideMark />
          </header>

          {undoItem && !isStudent ? (
            <header className="px-4 pt-4 sm:px-6 lg:px-8 lg:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--hub-border)] bg-white px-4 py-3">
                <p className="text-sm font-medium text-[color:var(--hub-text)]">{undoItem.label}</p>
                <button
                  type="button"
                  onClick={undoLastAction}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo
                </button>
              </div>
            </header>
          ) : null}

          <main className={`flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 ${className || ''}`}>{children}</main>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--hub-border)] bg-[color:var(--hub-panel)] px-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
            {showMobileMore ? (
              <div className="mx-auto mb-2 max-w-xl rounded-[26px] border border-[color:var(--hub-border)] bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">More</p>
                  <button type="button" onClick={() => setShowMobileMore(false)} className="rounded-full p-1.5 text-[color:var(--hub-muted)]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mobileOverflowItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold ${
                          isActive ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-text)]'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/login'); }}
                  className="mt-2 flex w-full items-center gap-2 rounded-2xl bg-[color:var(--hub-soft)] px-3 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : null}
            <div
              className={`mx-auto grid max-w-xl gap-1 rounded-[28px] bg-[color:var(--hub-panel)] p-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] ${
                mobileOverflowItems.length > 0 ? 'grid-cols-5' : 'grid-cols-5'
              }`}
            >
              {mobilePrimaryItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition ${
                      isActive ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
              {mobileOverflowItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowMobileMore((current) => !current)}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition ${
                    isMoreActive || showMobileMore ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'
                  }`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span>More</span>
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </div>
      <OnboardingTour />
    </>
  );
};
