import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { CourseLearningPage } from './pages/courses/CourseLearningPage';
import CourseAnnouncementsPage from './pages/courses/CourseAnnouncementsPage';
import QuizPage from './pages/assessments/QuizPage';
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
import ProfilePage from './pages/ProfilePage';
import CallsPage from './pages/CallsPage';
import { MarketingGuidePage } from './pages/MarketingGuidePage';

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

function App() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Initialize theme on app load
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    );
  }

  return (
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

            {/* Protected Routes */}
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

            {/* Default redirect */}
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
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
  );
}

export default App;
