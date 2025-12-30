import { isTeacher, getCurrentUser } from "@/api/auth-utils"
import { Courses } from "@/pages/Courses"
import { BrowseCourses } from "@/pages/BrowseCourses"

export function CoursesRouter() {
  const user = getCurrentUser()
  // For development: if no user, default to student mode
  const isTeacherMode = isTeacher() || (!user && false) // Set to false to show student browse by default
  
  if (isTeacherMode) {
    return <Courses />
  } else {
    return <BrowseCourses />
  }
}

