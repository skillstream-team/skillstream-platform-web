import { Navigate, useLocation } from "react-router-dom"
import { isAuthenticated, isAdmin, isTeacher, isStudent } from "@/api/auth-utils"
import { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: 'ADMIN' | 'TEACHER' | 'STUDENT'
  requireAnyRole?: ('ADMIN' | 'TEACHER' | 'STUDENT')[]
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requireRole,
  requireAnyRole 
}: ProtectedRouteProps) {
  const location = useLocation()
  const authenticated = isAuthenticated()

  // If authentication is required but user is not authenticated, redirect to login
  if (requireAuth && !authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but trying to access login/register, redirect to dashboard
  if (!requireAuth && authenticated) {
    return <Navigate to="/" replace />
  }

  // Check role requirements
  if (requireRole) {
    if (requireRole === 'ADMIN' && !isAdmin()) {
      return <Navigate to="/" replace />
    }
    if (requireRole === 'TEACHER' && !isTeacher()) {
      return <Navigate to="/" replace />
    }
    if (requireRole === 'STUDENT' && !isStudent()) {
      return <Navigate to="/" replace />
    }
  }

  // Check if user has any of the required roles
  if (requireAnyRole && requireAnyRole.length > 0) {
    const hasRequiredRole = requireAnyRole.some(role => {
      if (role === 'ADMIN') return isAdmin()
      if (role === 'TEACHER') return isTeacher()
      if (role === 'STUDENT') return isStudent()
      return false
    })
    
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

