import { isTeacher, isStudent, isAdmin, getCurrentUser } from "@/api/auth-utils"
import { Dashboard } from "@/pages/Dashboard"
import { StudentDashboard } from "@/pages/StudentDashboard"
import { AdminDashboard } from "@/pages/AdminDashboard"
import { MaintenanceModeBanner } from "@/components/MaintenanceModeBanner"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Navigate } from "react-router-dom"

export function DashboardRouter() {
  const { settings, loading: settingsLoading } = useSystemSettings()
  
  // Wait for settings to load
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Check if user is authenticated
  const user = getCurrentUser()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check maintenance mode - admins can still access
  if (settings?.maintenanceMode && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <MaintenanceModeBanner />
        </div>
      </div>
    )
  }
  
  // Route based on user role
  const userIsAdmin = isAdmin()
  const userIsTeacher = isTeacher()
  const userIsStudent = isStudent()
  
  if (userIsAdmin) {
    return (
      <>
        <MaintenanceModeBanner />
        <AdminDashboard />
      </>
    )
  }
  
  if (userIsTeacher) {
    return (
      <>
        <MaintenanceModeBanner />
        <Dashboard />
      </>
    )
  }
  
  if (userIsStudent) {
    return (
      <>
        <MaintenanceModeBanner />
        <StudentDashboard />
      </>
    )
  }
  
  // Fallback - should not reach here if user is properly authenticated
  return <Navigate to="/login" replace />
}

