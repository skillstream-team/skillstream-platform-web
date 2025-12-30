import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext"
import { ErrorProvider } from "@/contexts/ErrorContext"
import { PlatformTitle } from "@/components/PlatformTitle"
import { DashboardRouter } from "./components/DashboardRouter"
import { CoursesRouter } from "./components/CoursesRouter"
import { Courses } from "./pages/Courses"
import { CreateCourse } from "./pages/CreateCourse"
import { CourseBuilder } from "./pages/CourseBuilder"
import { LessonEditor } from "./pages/LessonEditor"
import { Students } from "./pages/Students"
import { Enrollments } from "./pages/Enrollments"
import { Earnings } from "./pages/Earnings"
import { Messages } from "./pages/Messages"
import { Reviews } from "./pages/Reviews"
import { Settings } from "./pages/Settings"
import { ScheduleLesson } from "./pages/ScheduleLesson"
import { UpcomingLessons } from "./pages/UpcomingLessons"
import { LessonsCalendar } from "./pages/LessonsCalendar"
import { GradingBook } from "./pages/GradingBook"
import { CourseActivity } from "./pages/CourseActivity"
import { CourseQA } from "./pages/CourseQA"
import { Announcements } from "./pages/Announcements"
import { WhiteboardEditor } from "./pages/WhiteboardEditor"
import { StudentDashboard } from "./pages/StudentDashboard"
import { MyCourses } from "./pages/MyCourses"
import { BrowseCourses } from "./pages/BrowseCourses"
import { CourseDetail } from "./pages/CourseDetail"
import { CoursePlayer } from "./pages/CoursePlayer"
import { LearningPaths } from "./pages/LearningPaths"
import { MyCertificates } from "./pages/MyCertificates"
import { LearningAnalytics } from "./pages/LearningAnalytics"
import { StudyGoals } from "./pages/StudyGoals"
import { ImportCourses } from "./pages/ImportCourses"
import { AdminDashboard } from "./pages/AdminDashboard"
import { AdminUsers } from "./pages/AdminUsers"
import { AdminCourses } from "./pages/AdminCourses"
import { AdminReports } from "./pages/AdminReports"
import { AdminAnalytics } from "./pages/AdminAnalytics"
import { AdminSettings } from "./pages/AdminSettings"
import { AdminCategories } from "./pages/AdminCategories"
import { AdminTags } from "./pages/AdminTags"
import { AdminPayouts } from "./pages/AdminPayouts"
import { AdminBulkOperations } from "./pages/AdminBulkOperations"
import { AdminBroadcasts } from "./pages/AdminBroadcasts"
import { AdminActivityLogs } from "./pages/AdminActivityLogs"
import { AdminUserImport } from "./pages/AdminUserImport"
import { AdminCoupons } from "./pages/AdminCoupons"
import { AdminReviews } from "./pages/AdminReviews"
import { AdminCertificates } from "./pages/AdminCertificates"
import { AdminAnnouncements } from "./pages/AdminAnnouncements"
import { AdminEmailTemplates } from "./pages/AdminEmailTemplates"
import { AdminQuizzes } from "./pages/AdminQuizzes"
import { AdminWhiteboards } from "./pages/AdminWhiteboards"
import { AdminForums } from "./pages/AdminForums"
import { AdminQA } from "./pages/AdminQA"
import { AdminReferrals } from "./pages/AdminReferrals"
import { AdminBundles } from "./pages/AdminBundles"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <ErrorBoundary>
      <SystemSettingsProvider>
        <ErrorProvider>
          <PlatformTitle />
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute requireAuth={false}><Register /></ProtectedRoute>} />
        
        {/* Protected Dashboard Route */}
        <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requireRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute requireRole="ADMIN"><AdminCourses /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute requireRole="ADMIN"><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/tags" element={<ProtectedRoute requireRole="ADMIN"><AdminTags /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute requireRole="ADMIN"><AdminPayouts /></ProtectedRoute>} />
        <Route path="/admin/bulk" element={<ProtectedRoute requireRole="ADMIN"><AdminBulkOperations /></ProtectedRoute>} />
        <Route path="/admin/broadcasts" element={<ProtectedRoute requireRole="ADMIN"><AdminBroadcasts /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute requireRole="ADMIN"><AdminActivityLogs /></ProtectedRoute>} />
        <Route path="/admin/user-import" element={<ProtectedRoute requireRole="ADMIN"><AdminUserImport /></ProtectedRoute>} />
        <Route path="/admin/coupons" element={<ProtectedRoute requireRole="ADMIN"><AdminCoupons /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute requireRole="ADMIN"><AdminReviews /></ProtectedRoute>} />
        <Route path="/admin/certificates" element={<ProtectedRoute requireRole="ADMIN"><AdminCertificates /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute requireRole="ADMIN"><AdminAnnouncements /></ProtectedRoute>} />
        <Route path="/admin/email-templates" element={<ProtectedRoute requireRole="ADMIN"><AdminEmailTemplates /></ProtectedRoute>} />
        <Route path="/admin/quizzes" element={<ProtectedRoute requireRole="ADMIN"><AdminQuizzes /></ProtectedRoute>} />
        <Route path="/admin/whiteboards" element={<ProtectedRoute requireRole="ADMIN"><AdminWhiteboards /></ProtectedRoute>} />
        <Route path="/admin/forums" element={<ProtectedRoute requireRole="ADMIN"><AdminForums /></ProtectedRoute>} />
        <Route path="/admin/qa" element={<ProtectedRoute requireRole="ADMIN"><AdminQA /></ProtectedRoute>} />
        <Route path="/admin/referrals" element={<ProtectedRoute requireRole="ADMIN"><AdminReferrals /></ProtectedRoute>} />
        <Route path="/admin/bundles" element={<ProtectedRoute requireRole="ADMIN"><AdminBundles /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requireRole="ADMIN"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requireRole="ADMIN"><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireRole="ADMIN"><AdminSettings /></ProtectedRoute>} />
        
        {/* Teacher Routes */}
        <Route path="/courses" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><CoursesRouter /></ProtectedRoute>} />
        <Route path="/courses/new" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><CreateCourse /></ProtectedRoute>} />
        <Route path="/courses/import" element={<ProtectedRoute requireRole="ADMIN"><ImportCourses /></ProtectedRoute>} />
        <Route path="/courses/:courseId/builder" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><CourseBuilder /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><LessonEditor /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons/new/edit" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><LessonEditor /></ProtectedRoute>} />
        <Route path="/courses/:courseId/modules/:moduleId/lessons/new" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><LessonEditor /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><Students /></ProtectedRoute>} />
        <Route path="/students/enrollments" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><Enrollments /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><Earnings /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><Reviews /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/account" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/billing" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/lessons/new" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><ScheduleLesson /></ProtectedRoute>} />
        <Route path="/lessons/upcoming" element={<ProtectedRoute requireAnyRole={['TEACHER', 'STUDENT', 'ADMIN']}><UpcomingLessons /></ProtectedRoute>} />
        <Route path="/lessons/calendar" element={<ProtectedRoute requireAnyRole={['TEACHER', 'STUDENT', 'ADMIN']}><LessonsCalendar /></ProtectedRoute>} />
        <Route path="/courses/:courseId/grading" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><GradingBook /></ProtectedRoute>} />
        <Route path="/courses/:courseId/activity" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><CourseActivity /></ProtectedRoute>} />
        <Route path="/courses/:courseId/qa" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><CourseQA /></ProtectedRoute>} />
        <Route path="/courses/:courseId/announcements" element={<ProtectedRoute requireAnyRole={['TEACHER', 'ADMIN']}><Announcements /></ProtectedRoute>} />
        <Route path="/courses/:courseId/whiteboard/:whiteboardId" element={<ProtectedRoute><WhiteboardEditor /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons/:lessonId/whiteboard/:whiteboardId" element={<ProtectedRoute><WhiteboardEditor /></ProtectedRoute>} />
        
        {/* Student Routes */}
        <Route path="/my-courses" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><MyCourses /></ProtectedRoute>} />
        <Route path="/my-courses/in-progress" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><MyCourses /></ProtectedRoute>} />
        <Route path="/my-courses/completed" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><MyCourses /></ProtectedRoute>} />
        <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><CoursePlayer /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><CoursePlayer /></ProtectedRoute>} />
        <Route path="/learning-paths" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><LearningPaths /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><MyCertificates /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><LearningAnalytics /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><StudyGoals /></ProtectedRoute>} />
        <Route path="/learning-paths/:pathId" element={<ProtectedRoute requireAnyRole={['STUDENT', 'ADMIN']}><LearningPaths /></ProtectedRoute>} />
        </Routes>
        </BrowserRouter>
        </ErrorProvider>
      </SystemSettingsProvider>
    </ErrorBoundary>
  )
}

export default App

