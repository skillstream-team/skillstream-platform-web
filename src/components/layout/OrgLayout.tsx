import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Award, Bell, BookOpen, BookOpenCheck, ChevronDown, ClipboardList, CreditCard, FileText, LayoutDashboard, LogOut, Moon, Monitor, Route, ShieldCheck, Sun, Trophy, Users, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { useOrgHubStore } from '../../store/orgHub';
import { getInitials } from '../../lib/utils';
import { SkillStreamLogo } from '../branding/SkillStreamLogo';

interface OrgLayoutProps {
  children: React.ReactNode;
}

export const OrgLayout: React.FC<OrgLayoutProps> = ({ children }) => {
  const { user, logout, setActiveOrgId } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { org } = useOrgHubStore();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const memberships = user?.orgMemberships ?? [];
  const activeOrg = memberships.find((m) => m.orgId === user?.activeOrgId) ?? memberships[0] ?? null;
  const activeOrgRole = activeOrg?.orgRole ?? null;
  const isOrgAdmin = activeOrgRole === 'admin' || activeOrgRole === 'instructor';
  const isManager = activeOrgRole === 'manager';

  const adminNav = activeOrg && isOrgAdmin ? [
    { to: `/org/${activeOrg.orgId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/org/${activeOrg.orgId}/courses`, label: 'Courses', icon: BookOpen },
    { to: `/org/${activeOrg.orgId}/paths`, label: 'Learning Paths', icon: Route },
    { to: `/org/${activeOrg.orgId}/learners`, label: 'Learners', icon: Users },
    { to: `/org/${activeOrg.orgId}/reports`, label: 'Reports', icon: ShieldCheck },
    { to: `/org/${activeOrg.orgId}/certificates`, label: 'Certificates', icon: Award },
    { to: `/org/${activeOrg.orgId}/announcements`, label: 'Announcements', icon: Bell },
    { to: `/org/${activeOrg.orgId}/audit`, label: 'Audit Log', icon: ClipboardList },
    { to: `/org/${activeOrg.orgId}/billing`, label: 'Billing', icon: CreditCard },
    { to: `/org/${activeOrg.orgId}/settings`, label: 'Settings', icon: FileText },
  ] : [];

  const managerNav = activeOrg && isManager ? [
    { to: `/org/${activeOrg.orgId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/org/${activeOrg.orgId}/learners`, label: 'My Team', icon: Users },
    { to: `/org/${activeOrg.orgId}/reports`, label: 'Reports', icon: ShieldCheck },
    { to: '/learn', label: 'My Learning', icon: BookOpenCheck },
    { to: '/learn/certificates', label: 'Certificates', icon: Trophy },
  ] : [];

  const learnerNav = [
    { to: '/learn', label: 'My Learning', icon: BookOpenCheck },
    { to: '/learn/certificates', label: 'Certificates', icon: Award },
  ];

  const navItems = isOrgAdmin ? adminNav : isManager ? managerNav : learnerNav;

  if (!user) return <>{children}</>;

  const SidebarContent = () => (
    <div className="flex h-full flex-col rounded-[32px] border border-[color:var(--hub-border)] bg-[color:var(--hub-panel)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <SkillStreamLogo to={isOrgAdmin && activeOrg ? `/org/${activeOrg.orgId}/dashboard` : '/learn'} hideMark />

      {activeOrg ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[color:var(--hub-soft)] px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {org?.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-7 w-7 shrink-0 rounded-lg object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-muted)]">Organisation</p>
              <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{activeOrg.orgName}</p>
            </div>
          </div>
          {memberships.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOrgSwitcher((v) => !v)}
                className="flex items-center gap-1 rounded-lg p-1.5 text-[color:var(--hub-muted)] hover:bg-white"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              {showOrgSwitcher ? (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-2xl border border-[color:var(--hub-border)] bg-white p-2 shadow-lg">
                  {memberships.map((m) => (
                    <button
                      key={m.orgId}
                      type="button"
                      onClick={() => { setActiveOrgId(m.orgId); setShowOrgSwitcher(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${m.orgId === user?.activeOrgId ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]'}`}
                    >
                      {m.orgName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <nav className="mt-6 grid gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/learn'}
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
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[color:var(--hub-bg)] text-[color:var(--hub-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-0 lg:px-6 lg:py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-[280px] shrink-0 lg:flex lg:flex-col">
          <SidebarContent />
        </aside>

        {/* Mobile top bar */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[color:var(--hub-border)] bg-[color:var(--hub-panel)] px-4 py-3 lg:hidden">
            <SkillStreamLogo to={isOrgAdmin && activeOrg ? `/org/${activeOrg.orgId}/dashboard` : '/learn'} hideMark />
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="rounded-xl p-2 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>

          {/* Mobile drawer */}
          {showMobileMenu ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileMenu(false)} />
              <div className="absolute left-0 top-0 h-full w-[280px] p-4">
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={() => setShowMobileMenu(false)} className="rounded-xl p-2 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="h-[calc(100%-3rem)]">
                  <SidebarContent />
                </div>
              </div>
            </div>
          ) : null}

          <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
