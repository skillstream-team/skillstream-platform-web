import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { setRefreshToken } from './services/api';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { CourseLearningPage } from './pages/courses/CourseLearningPage';
import CourseAnnouncementsPage from './pages/courses/CourseAnnouncementsPage';
import QuizPage from './pages/assessments/QuizPage';
import QuizzesPage from './pages/assessments/QuizzesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { NotificationManager } from './components/notifications/NotificationToast';
import { AIChatAssistant } from './components/ai/AIChatAssistant';
import websocketService from './services/websocket';
import { WebSocketMessage } from './types';
import CalendarPage from './pages/CalendarPage';
import { ProgressTracker } from './components/progress/ProgressTracker';
import { StudyGroups } from './components/collaboration/StudyGroups';
import { ForumBoard } from './components/forum/ForumBoard';
import { FileManagementPage } from './pages/FileManagementPage';
import { MessagesPage } from './pages/MessagesPage';
import { PeopleGroupsPage } from './pages/PeopleGroupsPage';
import AssignmentsPage from './pages/assessments/AssignmentsPage';
import AssignmentSubmitPage from './pages/assessments/AssignmentSubmitPage';
import GradeAssignmentsPage from './pages/assessments/GradeAssignmentsPage';
import { GradebookPage } from './pages/gradebook/GradebookPage';
import ProfilePage from './pages/ProfilePage';
import CallsPage from './pages/CallsPage';
import { MarketingGuidePage } from './pages/MarketingGuidePage';
import { EarningsReportPage } from './pages/EarningsReportPage';
import { QuickLessonPage } from './pages/lessons/QuickLessonPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { TeacherAvailabilityPage } from './pages/lessons/TeacherAvailabilityPage';
import { StudentBookingPage } from './pages/lessons/StudentBookingPage';
import { LessonsPage } from './pages/lessons/LessonsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { StudentProgressPage } from './pages/students/StudentProgressPage';
import { ContentLibraryPage } from './pages/content/ContentLibraryPage';
import { StudentGroupsPage } from './pages/students/StudentGroupsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user && user.role === 'ADMIN' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Teacher Route Component
const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user && user.role === 'TEACHER' ? <>{children}</> : <Navigate to="/home" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Forum Route Wrapper Component
const ForumRoute: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  return <ForumBoard courseId={courseId || ''} />;
};

// Google OAuth Callback Component (handles /auth/google/callback)
const GoogleOAuthCallback: React.FC = () => {
  const { handleOAuthLogin } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processGoogleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Check for OAuth errors first
        if (errorParam) {
          const errorMessage = errorDescription || errorParam;
          setError(errorMessage);
          setLoading(false);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
          }, 3000);
          return;
        }

        const storedState = sessionStorage.getItem('oauth_state');

        // Validate state if provided
        if (state && storedState && state !== storedState) {
          setError('Invalid state parameter. Possible CSRF attack.');
          setLoading(false);
          setTimeout(() => {
            navigate('/login?error=invalid_state');
          }, 3000);
          return;
        }

        if (!code) {
          setError('Missing authorization code');
          setLoading(false);
          setTimeout(() => {
            navigate('/login?error=missing_code');
          }, 3000);
          return;
        }

        // Clear stored OAuth data
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_redirect_uri');

        // Complete OAuth login (this will exchange code for token and send to backend)
        await handleOAuthLogin('google', code, state || undefined);
        
        // Navigate to dashboard on success
        setLoading(false);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Google OAuth login failed:', err);
        const errorMessage = err.response?.data?.error || err.message || 'OAuth login failed';
        setError(errorMessage);
        setLoading(false);
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      }
    };

    processGoogleOAuthCallback();
  }, [handleOAuthLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto p-8">
        {error ? (
          <>
            <div className="text-red-600 dark:text-red-400 mb-4 text-lg font-semibold">
              Authentication Error
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login...</p>
          </>
        ) : loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Completing login...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

// Generic OAuth Callback Component (for LinkedIn and other providers)
const OAuthCallback: React.FC = () => {
  const { handleOAuthLogin } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const provider = urlParams.get('provider') as 'google' | 'linkedin' | null;

        // Check for OAuth errors first
        if (errorParam) {
          const errorMessage = errorDescription || errorParam;
          setError(errorMessage);
          setLoading(false);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
          }, 3000);
          return;
        }

        // Get provider from sessionStorage or URL params
        const storedProvider = sessionStorage.getItem('oauth_provider') as 'google' | 'linkedin' | null;
        const finalProvider = provider || storedProvider;
        const storedState = sessionStorage.getItem('oauth_state');

        // Validate state if provided
        if (state && storedState && state !== storedState) {
          setError('Invalid state parameter. Possible CSRF attack.');
          setLoading(false);
          setTimeout(() => {
            navigate('/login?error=invalid_state');
          }, 3000);
          return;
        }

        if (!code) {
          setError('Missing authorization code');
          setLoading(false);
          setTimeout(() => {
            navigate('/login?error=missing_code');
          }, 3000);
          return;
        }

        if (!finalProvider) {
          setError('Unable to determine OAuth provider');
          setLoading(false);
          setTimeout(() => {
            navigate('/login?error=missing_provider');
          }, 3000);
          return;
        }

        // Clear stored OAuth data
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_redirect_uri');

        // Complete OAuth login
        await handleOAuthLogin(finalProvider, code, state || undefined);
        
        // Navigate to dashboard on success
        navigate('/dashboard');
      } catch (err: any) {
        console.error('OAuth login failed:', err);
        const errorMessage = err.response?.data?.error || err.message || 'OAuth login failed';
        setError(errorMessage);
        setLoading(false);
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      }
    };

    processOAuthCallback();
  }, [handleOAuthLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto p-8">
        {error ? (
          <>
            <div className="text-red-600 dark:text-red-400 mb-4 text-lg font-semibold">
              Authentication Error
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login...</p>
          </>
        ) : loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Completing login...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

function App() {
  const { user } = useAuthStore();
  const { theme, getEffectiveTheme } = useThemeStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Initialize refresh token on app load
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
  }, []);

  // Initialize theme on app load and listen for system preference changes
  useEffect(() => {
    // Apply initial theme
    const effectiveTheme = getEffectiveTheme();
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for system preference changes if theme is set to 'system'
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newEffectiveTheme = getEffectiveTheme();
        if (newEffectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme, getEffectiveTheme]);

  useEffect(() => {
    if (user) {
      // Initialize WebSocket connection when user is authenticated
      websocketService.connect();

      // Handle WebSocket messages
      const handleWebSocketMessage = (message: WebSocketMessage) => {
        console.log('WebSocket message received:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'NOTIFICATION':
            // Show notification toast
            (window as any).addNotification?.({
              type: 'info',
              title: 'New Notification',
              message: message.data.message || 'You have a new notification',
              duration: 5000
            });
            break;
          
          case 'CHAT':
            // Show chat notification
            (window as any).addNotification?.({
              type: 'info',
              title: 'New Message',
              message: `New message in ${message.data.courseId || 'course'}`,
              duration: 3000
            });
            break;
          
          case 'VIDEO':
            // Handle video call updates
            if (message.data.action === 'join') {
              (window as any).addNotification?.({
                type: 'info',
                title: 'Video Call',
                message: `${message.data.userName || 'Someone'} joined the video call`,
                duration: 3000
              });
            } else if (message.data.action === 'leave') {
              (window as any).addNotification?.({
                type: 'info',
                title: 'Video Call',
                message: `${message.data.userName || 'Someone'} left the video call`,
                duration: 3000
              });
            }
            break;
          
          case 'MESSAGE':
            // Show direct message notification
            (window as any).addNotification?.({
              type: 'info',
              title: 'New Direct Message',
              message: `Message from ${message.data.senderName || 'someone'}`,
              duration: 4000
            });
            break;
          
          default:
            console.log('Unknown message type:', message.type);
        }
      };

      // Handle connection status changes
      const handleConnectionChange = (connected: boolean) => {
        console.log('WebSocket connection:', connected ? 'connected' : 'disconnected');
        
        if (connected) {
          (window as any).addNotification?.({
            type: 'success',
            title: 'Connected',
            message: 'Real-time connection established',
            duration: 2000
          });
        } else {
          (window as any).addNotification?.({
            type: 'warning',
            title: 'Disconnected',
            message: 'Real-time connection lost. Trying to reconnect...',
            duration: 3000
          });
        }
      };

      websocketService.onMessage(handleWebSocketMessage);
      websocketService.onConnectionChange(handleConnectionChange);

      // Cleanup on unmount
      return () => {
        websocketService.offMessage(handleWebSocketMessage);
        websocketService.offConnectionChange(handleConnectionChange);
        websocketService.disconnect();
      };
    }
  }, [user]);

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationManager>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
            {/* Public Routes */}
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

            {/* Protected Routes - New Navigation Structure */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HomePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/home" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LearnPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DiscoverPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SearchResultsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CoursesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LessonsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CourseDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/learn"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CourseLearningPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/announcements"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CourseAnnouncementsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuizzesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuizPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/progress"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentProgressPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/students/progress"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentProgressPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <AdminNotificationsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
                          <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Track your learning journey and achievements
                          </p>
                        </div>
                        <ProgressTracker />
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CertificatesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-groups"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <StudyGroups />
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/forum"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ForumRoute />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* File Management Route */}
            <Route 
              path="/files" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <FileManagementPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Messages Route */}
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
              path="/messages/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:userId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* People Route */}
            <Route
              path="/people"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PeopleGroupsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Assignments Route */}
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssignmentsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/grade"
              element={
                <TeacherRoute>
                  <Layout>
                    <GradeAssignmentsPage />
                  </Layout>
                </TeacherRoute>
              }
            />
            <Route
              path="/gradebook"
              element={
                <TeacherRoute>
                  <Layout>
                    <GradebookPage />
                  </Layout>
                </TeacherRoute>
              }
            />
            <Route
              path="/content-library"
              element={
                <TeacherRoute>
                  <Layout>
                    <ContentLibraryPage />
                  </Layout>
                </TeacherRoute>
              }
            />
            <Route
              path="/students/groups"
              element={
                <TeacherRoute>
                  <Layout>
                    <StudentGroupsPage />
                  </Layout>
                </TeacherRoute>
              }
            />
            <Route
              path="/assignments/:assignmentId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssignmentSubmitPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:assignmentId/submit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssignmentSubmitPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </AdminRoute>
              }
            />

            {/* Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Lesson Management Routes */}
            <Route
              path="/lessons/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuickLessonPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons/availability"
              element={
                <TeacherRoute>
                  <Layout>
                    <TeacherAvailabilityPage />
                  </Layout>
                </TeacherRoute>
              }
            />
            <Route
              path="/lessons/book"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentBookingPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Calls Route */}
            <Route
              path="/calls/:contactId"
              element={
                <ProtectedRoute>
                  <CallsPage />
                </ProtectedRoute>
              }
            />

            {/* Marketing Guide Route */}
            <Route
              path="/marketing-guide"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketingGuidePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Earnings Report Route */}
            <Route
              path="/earnings-report"
              element={
                <TeacherRoute>
                  <Layout>
                    <EarningsReportPage />
                  </Layout>
                </TeacherRoute>
              }
            />

            {/* Revenue Growth Guide Route */}
            <Route
              path="/revenue-growth"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketingGuidePage guideType="revenue" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route
              path="/"
              element={<Navigate to={user ? "/home" : "/login"} replace />}
            />
          </Routes>

          {/* AI Chat Assistant - Available on all protected pages */}
          {user && (
            <AIChatAssistant
              isOpen={isAIChatOpen}
              onClose={() => setIsAIChatOpen(false)}
              onToggle={() => setIsAIChatOpen(!isAIChatOpen)}
            />
          )}
        </div>
      </Router>
    </NotificationManager>
    </ErrorBoundary>
  );
}

export default App;
