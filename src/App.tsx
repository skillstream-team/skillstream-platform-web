import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NotificationManager } from './components/notifications/NotificationToast';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassPage } from './pages/ClassPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { SchedulePage } from './pages/SchedulePage';
import { MessagesPage } from './pages/MessagesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppPageLoader } from './components/common/AppPageLoader';
import { useTeacherHubStore } from './store/teacherHub';
import { usePreferencesStore } from './store/preferences';
import { useCurrencyStore } from './store/currency';
import { resolveStudentTheme } from './data/studentThemes';
import { OrgLayout } from './components/layout/OrgLayout';
import { OrgDashboardPage } from './pages/org/OrgDashboardPage';
import { OrgCoursesPage } from './pages/org/OrgCoursesPage';
import { OrgCourseBuilderPage } from './pages/org/OrgCourseBuilderPage';
import { OrgLearnersPage } from './pages/org/OrgLearnersPage';
import { OrgLearnerProfilePage } from './pages/org/OrgLearnerProfilePage';
import { OrgReportsPage } from './pages/org/OrgReportsPage';
import { OrgSettingsPage } from './pages/org/OrgSettingsPage';
import { OrgPathsPage } from './pages/org/OrgPathsPage';
import { OrgPathDetailPage } from './pages/org/OrgPathDetailPage';
import { OrgAnnouncementsPage } from './pages/org/OrgAnnouncementsPage';
import { OrgBillingPage } from './pages/org/OrgBillingPage';
import { OrgCertificatesPage } from './pages/org/OrgCertificatesPage';
import { OrgAuditPage } from './pages/org/OrgAuditPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { LearnPage } from './pages/learn/LearnPage';
import { CoursePlayerPage } from './pages/learn/CoursePlayerPage';
import { CertificatesPage } from './pages/learn/CertificatesPage';

type AuthUser = NonNullable<ReturnType<typeof useAuthStore.getState>['user']>;
const homeRoute = (user: AuthUser | null) => {
  if (!user) return '/login';
  if (user.activeOrgId) {
    const orgRole = user.orgMemberships.find((m) => m.orgId === user.activeOrgId)?.orgRole;
    if (orgRole === 'admin' || orgRole === 'instructor') return `/org/${user.activeOrgId}/dashboard`;
    return '/learn';
  }
  if (user.role === 'ADMIN') return '/admin';
  return '/dashboard';
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <Navigate to={homeRoute(user)} replace /> : <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; allow: Array<'TEACHER' | 'STUDENT' | 'ADMIN'> }> = ({ children, allow }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const OAuthDisabledPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--hub-bg)] p-6">
      <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-8 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="text-lg font-semibold text-[color:var(--hub-text)]">OAuth callback not configured</p>
        <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Redirecting to sign in.</p>
      </div>
    </div>
  );
};

function App() {
  const { user, isLoading, initAuth } = useAuthStore();
  const loadWorkspace = useTeacherHubStore((state) => state.loadWorkspace);
  const isWorkspaceHydrated = useTeacherHubStore((state) => state.isHydrated);
  const isWorkspaceSyncing = useTeacherHubStore((state) => state.isSyncing);
  const loadPreferences = usePreferencesStore((state) => state.loadPreferences);
  const loadCurrency = useCurrencyStore((state) => state.loadCurrency);
  const studentTheme = usePreferencesStore((state) => state.preferences.studentTheme);
  const { theme, getEffectiveTheme } = useThemeStore();

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace, user?.id, user?.role]);

  useEffect(() => {
    void loadPreferences(user?.id);
  }, [loadPreferences, user?.id]);

  useEffect(() => {
    void loadCurrency();
  }, [loadCurrency]);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      const effectiveTheme = getEffectiveTheme();
      const color = resolveStudentTheme(studentTheme, effectiveTheme);
      document.documentElement.style.setProperty('--hub-primary', color);
    } else {
      document.documentElement.style.removeProperty('--hub-primary');
    }
  }, [user?.role, studentTheme, theme, getEffectiveTheme]);

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');

    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.classList.toggle('dark', getEffectiveTheme() === 'dark');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [getEffectiveTheme, theme]);

  if (isLoading || (user && !isWorkspaceHydrated && isWorkspaceSyncing)) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-[color:var(--hub-bg)] p-6">
          <div className="mx-auto max-w-3xl pt-16">
            <AppPageLoader message={isLoading ? 'Loading session...' : 'Loading workspace...'} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationManager>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/auth/google/callback" element={<OAuthDisabledPage />} />
            <Route path="/oauth/callback" element={<OAuthDisabledPage />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClassesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/class/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClassPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/class/:id/live/:lessonId"
              element={
                <ProtectedRoute>
                  <LiveSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <RoleRoute allow={['TEACHER', 'ADMIN']}>
                  <Layout>
                    <StudentsPage />
                  </Layout>
                </RoleRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SchedulePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <RoleRoute allow={['TEACHER', 'ADMIN']}>
                  <Layout>
                    <PaymentsPage />
                  </Layout>
                </RoleRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute allow={['ADMIN']}>
                  <Layout>
                    <AdminPage />
                  </Layout>
                </RoleRoute>
              }
            />

            {/* B2B Org Admin Routes */}
            <Route path="/org/:orgId/dashboard" element={<ProtectedRoute><OrgLayout><OrgDashboardPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/courses" element={<ProtectedRoute><OrgLayout><OrgCoursesPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/courses/:courseId/build" element={<ProtectedRoute><OrgLayout><OrgCourseBuilderPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/paths" element={<ProtectedRoute><OrgLayout><OrgPathsPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/paths/:pathId" element={<ProtectedRoute><OrgLayout><OrgPathDetailPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/learners" element={<ProtectedRoute><OrgLayout><OrgLearnersPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/learners/:userId" element={<ProtectedRoute><OrgLayout><OrgLearnerProfilePage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/reports" element={<ProtectedRoute><OrgLayout><OrgReportsPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/announcements" element={<ProtectedRoute><OrgLayout><OrgAnnouncementsPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/settings" element={<ProtectedRoute><OrgLayout><OrgSettingsPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/billing" element={<ProtectedRoute><OrgLayout><OrgBillingPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/certificates" element={<ProtectedRoute><OrgLayout><OrgCertificatesPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/org/:orgId/audit" element={<ProtectedRoute><OrgLayout><OrgAuditPage /></OrgLayout></ProtectedRoute>} />

            {/* Learner Portal Routes */}
            <Route path="/learn" element={<ProtectedRoute><OrgLayout><LearnPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/learn/course/:courseId" element={<ProtectedRoute><OrgLayout><CoursePlayerPage /></OrgLayout></ProtectedRoute>} />
            <Route path="/learn/certificates" element={<ProtectedRoute><OrgLayout><CertificatesPage /></OrgLayout></ProtectedRoute>} />

            <Route
              path="/"
              element={
                user ? <Navigate to={homeRoute(user)} replace /> : <LandingPage />
              }
            />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/calendar" element={<Navigate to="/schedule" replace />} />
            <Route path="/messages/new" element={<Navigate to="/messages" replace />} />
            <Route path="/messages/:userId" element={<Navigate to="/messages" replace />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </NotificationManager>
    </ErrorBoundary>
  );
}

export default App;
