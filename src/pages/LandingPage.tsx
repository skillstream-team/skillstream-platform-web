import React, { useState } from 'react';
import { useCurrencyFormatter } from '../lib/currency';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Video,
  X,
} from 'lucide-react';
import { SkillStreamLogo } from '../components/branding/SkillStreamLogo';

/* ─── constants ──────────────────────────────────────────────── */
const formatNum = (v: number) => new Intl.NumberFormat('en-US').format(v);

const FEATURES = [
  {
    icon: Video,
    title: 'Live video classes',
    body: 'Host HD sessions straight from your browser. Mute, remove, or spotlight participants with full host controls.',
  },
  {
    icon: BookOpen,
    title: 'Assignments & feedback',
    body: 'Send homework to a single student or your whole class. Track submissions and write feedback from one view.',
  },
  {
    icon: CalendarDays,
    title: 'Lesson scheduling',
    body: 'Plan your week with a visual calendar. Your students always know what\'s coming up and when to show up.',
  },
  {
    icon: Users,
    title: 'Student management',
    body: 'See all your students in one place. Track engagement, progress, and assignment history per individual.',
  },
  {
    icon: CreditCard,
    title: 'Payments & billing',
    body: 'Charge per session or run a free class. Students pay through a secure hosted checkout — no manual invoicing.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create your class',
    body: 'Set up a class in under a minute. Add an overview, choose your settings, and share your unique invite code with students.',
  },
  {
    n: '02',
    title: 'Go live',
    body: 'Schedule a lesson, then launch it when you\'re ready. Video is live the moment you open the session.',
  },
  {
    n: '03',
    title: 'Assign, earn & grow',
    body: 'Send homework after class, charge for sessions, and track every student\'s progress from your dashboard.',
  },
];

const PLANS = [
  {
    id: 'creator',
    name: 'Creator',
    price: 29,
    minutes: 5_000,
    fee: 10,
    maxStudents: 15,
    maxLiveParticipants: 5,
    description: 'Solo tutors, music teachers & local coaches.',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 99,
    minutes: 40_000,
    fee: 6,
    maxStudents: 100,
    maxLiveParticipants: 50,
    description: 'Growing academies and full-time independent educators.',
    popular: true,
  },
  {
    id: 'academy',
    name: 'Academy',
    price: 249,
    minutes: 150_000,
    fee: 5,
    maxStudents: null,
    maxLiveParticipants: 200,
    description: 'Training organisations, corporate L&D & multi-teacher operations.',
  },
];

const STUDENT_POINTS = [
  'Join live lessons from any browser — no download needed',
  'Receive and submit assignments in one place',
  'Message your teacher directly between sessions',
  'View your upcoming lesson schedule at a glance',
  'Pay for sessions securely through a hosted checkout',
];

/* ─── component ──────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { format: formatPrice } = useCurrencyFormatter();

  return (
    <div className="min-h-screen" style={{ background: '#060d18', color: 'white' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(6,13,24,0.92)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <SkillStreamLogo to="/" hideMark light />

          <nav className="hidden items-center md:flex">
            {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-semibold transition"
                style={{ color: 'rgba(255,255,255,0.55)', padding: '0.5rem 1.75rem' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'white'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Sign in
            </Link>
            <Link
              to="/register?role=teacher"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: '#2563eb' }}
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 md:hidden"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t px-6 pb-6 md:hidden" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <nav className="mt-4 grid gap-1">
              {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2.5">
              <Link to="/login" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>Sign in</Link>
              <Link to="/register?role=teacher" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ background: '#2563eb' }}>Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="text-center" style={{ padding: '4.5rem 1.5rem 6rem' }}>
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-4xl">
          <div
            className="mb-7 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', color: '#93c5fd' }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            Built for live educators
          </div>

          <h1
            className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: 'white', letterSpacing: '-0.03em' }}
          >
            Teach live.<br />
            <span style={{ color: '#60a5fa' }}>Own your classroom.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
            SkillStream is the all-in-one platform for educators. Host live video classes, manage your students, schedule lessons, send assignments, and get paid — without stitching together five different tools.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register?role=teacher"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white shadow-xl transition hover:opacity-90 sm:w-auto"
              style={{ background: '#2563eb', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}
            >
              Start teaching <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
              style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              Sign in
            </Link>
          </div>

        </div>

        {/* Platform preview — swaps device mockup by breakpoint to match how the real app lays out at that size */}
        <div className="relative mx-auto" style={{ marginTop: '3rem' }}>

          {/* Phone mockup — below md (real app: logo header + bottom tab bar, single-column stats) */}
          <div className="block md:hidden">
            <div
              className="relative mx-auto overflow-hidden"
              style={{ width: '280px', borderRadius: '36px', border: '10px solid #111827', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-2xl"
                style={{ width: '110px', height: '20px', background: '#111827' }}
              />
              <div className="relative overflow-hidden" style={{ background: '#f0f2f5', height: '540px' }}>
                {/* Top header — extra top padding clears the notch above it */}
                <div className="flex items-end justify-center px-4 pb-2" style={{ paddingTop: '24px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <span className="text-xs font-extrabold tracking-tight" style={{ color: '#1b4a80', fontFamily: 'serif' }}>SkillStream</span>
                </div>

                {/* Content */}
                <div className="p-3" style={{ paddingBottom: '68px' }}>
                  <p className="text-sm font-extrabold" style={{ color: '#162033' }}>Dashboard</p>
                  <p className="mb-3 text-[10px]" style={{ color: '#627086' }}>Welcome back, James</p>

                  {/* Stat cards — single column, matches real dashboard's grid-cols-1 below md */}
                  <div className="mb-3 grid grid-cols-1 gap-2">
                    {[
                      { label: 'Total students', value: '24', color: '#1b4a80' },
                      { label: 'Active classes', value: '3', color: '#0891b2' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-2.5" style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
                        <p className="text-[9px] font-semibold" style={{ color: '#627086' }}>{label}</p>
                        <p className="mt-0.5 text-lg font-extrabold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-3" style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#627086' }}>Your Classes</p>
                    {[
                      { name: 'Advanced English', students: 12, next: 'Today 4:00 PM', live: true },
                      { name: 'IELTS Preparation', students: 8, next: 'Thu 2:00 PM', live: false },
                    ].map(({ name, students, next, live }) => (
                      <div key={name} className="flex items-center justify-between border-b py-2 last:border-0" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                        <div>
                          <p className="text-[10px] font-bold" style={{ color: '#162033' }}>{name}</p>
                          <p className="text-[9px]" style={{ color: '#627086' }}>{students} students · {next}</p>
                        </div>
                        {live ? (
                          <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                            <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" /> Live
                          </span>
                        ) : (
                          <span className="rounded-full px-1.5 py-0.5 text-[8px] font-semibold" style={{ background: '#f0f2f5', color: '#627086' }}>Scheduled</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom tab bar — real app has no sidebar below lg, just this */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-around" style={{ height: '56px', background: 'white', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  {[
                    { Icon: Home, label: 'Home', active: true },
                    { Icon: BookOpen, label: 'Classes', active: false },
                    { Icon: Users, label: 'Students', active: false },
                    { Icon: CalendarDays, label: 'Schedule', active: false },
                    { Icon: Menu, label: 'More', active: false },
                  ].map(({ Icon, label, active }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <Icon style={{ width: 15, height: 15, color: active ? '#1b4a80' : '#9aa5b1' }} />
                      <span className="text-[7px] font-semibold" style={{ color: active ? '#1b4a80' : '#9aa5b1' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tablet mockup — md to lg (real app uses the same header + tab-bar nav as phone here, just a wider 2-col stat grid) */}
          <div className="hidden md:block lg:hidden">
            <div
              className="relative mx-auto overflow-hidden"
              style={{ width: '560px', borderRadius: '26px', border: '14px solid #111827', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
            >
              <div className="relative overflow-hidden" style={{ background: '#f0f2f5', height: '440px' }}>
                {/* Top header */}
                <div className="flex items-center justify-center px-4 py-3" style={{ background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <span className="text-sm font-extrabold tracking-tight" style={{ color: '#1b4a80', fontFamily: 'serif' }}>SkillStream</span>
                </div>

                {/* Content */}
                <div className="p-5" style={{ paddingBottom: '76px' }}>
                  <p className="text-base font-extrabold" style={{ color: '#162033' }}>Dashboard</p>
                  <p className="mb-4 text-[11px]" style={{ color: '#627086' }}>Welcome back, James</p>

                  {/* Stat cards — 2 columns, matches real dashboard's md:grid-cols-2 */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total students', value: '24', color: '#1b4a80' },
                      { label: 'Active classes', value: '3', color: '#0891b2' },
                      { label: 'Upcoming lessons', value: '5', color: '#7c3aed' },
                      { label: 'Pending tasks', value: '2', color: '#d97706' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-2xl p-3" style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
                        <p className="text-[10px] font-semibold" style={{ color: '#627086' }}>{label}</p>
                        <p className="mt-1 text-xl font-extrabold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#627086' }}>Your Classes</p>
                    {[
                      { name: 'Advanced English', students: 12, next: 'Today 4:00 PM', live: true },
                      { name: 'IELTS Preparation', students: 8, next: 'Thu 2:00 PM', live: false },
                      { name: 'Business Writing', students: 4, next: 'Fri 11:00 AM', live: false },
                    ].map(({ name, students, next, live }) => (
                      <div key={name} className="flex items-center justify-between border-b py-2.5 last:border-0" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: '#162033' }}>{name}</p>
                          <p className="text-[10px]" style={{ color: '#627086' }}>{students} students · {next}</p>
                        </div>
                        {live ? (
                          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: '#f0f2f5', color: '#627086' }}>Scheduled</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom tab bar */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-around" style={{ height: '60px', background: 'white', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  {[
                    { Icon: Home, label: 'Home', active: true },
                    { Icon: BookOpen, label: 'Classes', active: false },
                    { Icon: Users, label: 'Students', active: false },
                    { Icon: CalendarDays, label: 'Schedule', active: false },
                    { Icon: Menu, label: 'More', active: false },
                  ].map(({ Icon, label, active }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <Icon style={{ width: 17, height: 17, color: active ? '#1b4a80' : '#9aa5b1' }} />
                      <span className="text-[9px] font-semibold" style={{ color: active ? '#1b4a80' : '#9aa5b1' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop mockup — lg and up (real app: fixed sidebar, no bottom bar, 4-col stat grid) */}
          <div
            className="relative mx-auto hidden max-w-5xl overflow-hidden rounded-2xl lg:block"
            style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}
          >
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: '#1a1f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="h-3 w-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="h-3 w-3 rounded-full" style={{ background: '#27c93f' }} />
              <div className="mx-auto rounded-lg px-8 py-1 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                skillstream.world/dashboard
              </div>
            </div>

            {/* App shell — matches real platform layout */}
            <div className="flex" style={{ background: '#f0f2f5', minHeight: '380px' }}>

              {/* Sidebar — white rounded panel */}
              <div className="flex flex-col p-3" style={{ width: '188px', background: '#f0f2f5', flexShrink: 0 }}>
                <div
                  className="flex flex-1 flex-col rounded-[22px] p-3"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}
                >
                  {/* Logo area */}
                  <div className="mb-4 px-2 pt-1">
                    <span className="text-sm font-extrabold tracking-tight" style={{ color: '#1b4a80', fontFamily: 'serif' }}>SkillStream</span>
                  </div>

                  {/* Nav items */}
                  <nav className="flex flex-1 flex-col gap-0.5">
                    {[
                      { Icon: Home, label: 'Dashboard', active: true },
                      { Icon: BookOpen, label: 'Classes', active: false },
                      { Icon: Users, label: 'Students', active: false },
                      { Icon: CalendarDays, label: 'Schedule', active: false },
                      { Icon: MessageSquare, label: 'Messages', active: false },
                      { Icon: CreditCard, label: 'Payments', active: false },
                    ].map(({ Icon, label, active }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[11px] font-semibold"
                        style={{
                          background: active ? '#1b4a80' : 'transparent',
                          color: active ? 'white' : '#627086',
                        }}
                      >
                        <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                        {label}
                      </div>
                    ))}
                  </nav>

                  {/* Bottom settings + user */}
                  <div className="mt-3 border-t pt-2" style={{ borderColor: 'rgba(15,23,42,0.07)' }}>
                    <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[11px] font-semibold" style={{ color: '#627086' }}>
                      <Settings style={{ width: 13, height: 13 }} /> Settings
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-2 py-2" style={{ background: '#f4f6f8' }}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#1b4a80' }}>JD</div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold" style={{ color: '#162033' }}>James Doe</p>
                        <p className="truncate text-[9px]" style={{ color: '#627086' }}>Teacher</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-4" style={{ background: '#f0f2f5' }}>
                {/* Page header */}
                <div className="mb-4">
                  <p className="text-base font-extrabold" style={{ color: '#162033' }}>Dashboard</p>
                  <p className="text-[11px]" style={{ color: '#627086' }}>Welcome back, James</p>
                </div>

                {/* Stat cards */}
                <div className="mb-4 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total students', value: '24', color: '#1b4a80' },
                    { label: 'Active classes', value: '3', color: '#0891b2' },
                    { label: 'Upcoming lessons', value: '5', color: '#7c3aed' },
                    { label: 'Pending tasks', value: '2', color: '#d97706' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-2xl p-3.5"
                      style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}
                    >
                      <p className="text-[10px] font-semibold" style={{ color: '#627086' }}>{label}</p>
                      <p className="mt-1 text-2xl font-extrabold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Class list */}
                <div className="rounded-2xl p-4" style={{ background: 'white', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#627086' }}>Your Classes</p>
                  {[
                    { name: 'Advanced English', students: 12, next: 'Today 4:00 PM', live: true },
                    { name: 'IELTS Preparation', students: 8, next: 'Thu 2:00 PM', live: false },
                    { name: 'Business Writing', students: 4, next: 'Fri 11:00 AM', live: false },
                  ].map(({ name, students, next, live }) => (
                    <div key={name} className="flex items-center justify-between border-b py-2.5 last:border-0" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                      <div>
                        <p className="text-[11px] font-bold" style={{ color: '#162033' }}>{name}</p>
                        <p className="text-[10px]" style={{ color: '#627086' }}>{students} students · {next}</p>
                      </div>
                      {live ? (
                        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: '#f0f2f5', color: '#627086' }}>Scheduled</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE STRIP ──────────────────────────────────────── */}
      <div style={{ background: '#0b1525', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-white/8 px-6" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
          {[
            { stat: 'All-in-one', desc: 'Video, assignments, scheduling, and billing under one roof' },
            { stat: 'No installs', desc: 'You and your students join from any browser, instantly' },
            { stat: 'You own it', desc: 'Your classes, your students, your rates — full control' },
          ].map((item) => (
            <div key={item.stat} className="px-8 text-center first:pl-0 last:pr-0">
              <p className="text-lg font-extrabold text-white sm:text-xl">{item.stat}</p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '4.5rem 1.5rem' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: '#60a5fa' }}>Platform features</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              Built for how you teach
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Every feature you need to run a professional live teaching business — nothing you don't.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl p-6 transition"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.25)' }}
                >
                  <f.icon className="h-5 w-5" style={{ color: '#60a5fa' }} />
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '4.5rem 1.5rem', background: '#0b1525' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: '#60a5fa' }}>Getting started</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              Up and running in minutes
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
              No technical setup. No third-party accounts. Create your class and start teaching today.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="rounded-2xl p-7"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                  style={{ background: i === 0 ? '#2563eb' : 'rgba(37,99,235,0.2)', border: i === 0 ? 'none' : '1px solid rgba(37,99,235,0.3)', color: i === 0 ? 'white' : '#93c5fd' }}
                >
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/register?role=teacher"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition hover:opacity-90"
              style={{ background: '#2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
            >
              Create your first class <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '4.5rem 1.5rem' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: '#60a5fa' }}>Pricing</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
              All plans include live video, assignments, scheduling, and student management.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-2xl p-8"
                style={{
                  background: plan.popular ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.04)',
                  border: plan.popular ? '1.5px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.popular ? '0 0 40px rgba(37,99,235,0.15)' : 'none',
                }}
              >
                {plan.popular ? (
                  <span
                    className="absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: '#2563eb' }}
                  >
                    Most popular
                  </span>
                ) : null}

                <p className="text-base font-bold text-white">{plan.name}</p>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{plan.description}</p>

                <p className="mt-6 text-5xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
                  {formatPrice(plan.price)}
                  <span className="ml-1 text-lg font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </p>

                <div className="my-6" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                <ul className="space-y-3">
                  {[
                    plan.maxStudents !== null ? `Up to ${plan.maxStudents} active students` : 'Unlimited students',
                    `Up to ${plan.maxLiveParticipants} per live session`,
                    `${formatNum(plan.minutes)} live participant-minutes`,
                    `${plan.fee}% fee on paid sessions`,
                    'Live video sessions',
                    'Assignments & scheduling',
                    'Payments & billing',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                      <span style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register?role=teacher"
                  className="mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-bold text-white transition hover:opacity-85"
                  style={{ background: plan.popular ? '#2563eb' : 'rgba(255,255,255,0.1)', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.12)' }}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-7 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Subscriptions renew monthly. Cancel any time from your billing dashboard.
          </p>
        </div>
      </section>

      {/* ── STUDENTS ─────────────────────────────────────────── */}
      <section style={{ padding: '4.5rem 1.5rem', background: '#0b1525' }}>
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: '#34d399' }}>For students</p>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              Does your teacher use SkillStream?
            </h2>
            <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
              If your teacher runs their lessons on SkillStream, you can join in seconds with the invite code they share. No downloads, no complicated setup.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {STUDENT_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#34d399' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: '#059669' }}
              >
                Create a student account <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                style={{ border: '1.5px solid rgba(255,255,255,0.18)' }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div
          className="mx-auto max-w-3xl rounded-2xl px-10 py-16 text-center"
          style={{ background: 'linear-gradient(135deg, #0f2040 0%, #1e3a6e 100%)', border: '1px solid rgba(59,130,246,0.25)' }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Ready to start teaching?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join educators already using SkillStream to run live lessons, manage their students, and grow their teaching business.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register?role=teacher"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition hover:opacity-90"
              style={{ background: '#2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}
            >
              Start teaching <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-6 py-10" style={{ background: '#030810', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <SkillStreamLogo hideMark light />
          <nav className="flex flex-wrap justify-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} className="transition hover:text-white">{label}</a>
            ))}
            <Link to="/login" className="transition hover:text-white">Sign in</Link>
            <Link to="/register?role=teacher" className="transition hover:text-white">Register</Link>
          </nav>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} SkillStream</p>
            <div className="flex gap-4 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Link to="/terms" className="transition hover:text-white">Terms</Link>
              <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
              <Link to="/refund-policy" className="transition hover:text-white">Refunds</Link>
              <Link to="/acceptable-use" className="transition hover:text-white">Acceptable Use</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
