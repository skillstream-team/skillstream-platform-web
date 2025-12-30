import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Calendar,
  Clock,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { LessonsAPI } from "@/api/lessons.api"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { downloadICS, CalendarLesson } from "@/utils/calendar"
import { isTeacher, isStudent } from "@/api/auth-utils"

interface QuickLesson {
  id: string
  title: string
  description?: string
  teacherId: string
  scheduledAt: string
  subject?: string
  duration: number
  joinLink: string
  meetingId: string
  status: string
  teacher?: any
}

export function UpcomingLessons() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<QuickLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      // Determine role for API call
      const role = isTeacher() ? 'TEACHER' : 'STUDENT'
      const response = await LessonsAPI.getLessons({
        role,
        status: 'upcoming'
      })
      const quickLessons = response.data?.quickLessons || []
      setLessons(quickLessons)
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `In ${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `In ${hours} hour${hours > 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `In ${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    return 'Starting soon'
  }

  const handleDeleteClick = (lessonId: string) => {
    setLessonToDelete(lessonId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!lessonToDelete) return

    try {
      await LessonsAPI.deleteLesson(lessonToDelete)
      toast.success('Lesson deleted successfully')
      setDeleteDialogOpen(false)
      setLessonToDelete(null)
      fetchLessons()
    } catch (error: any) {
      console.error('Failed to delete lesson:', error)
      toast.error('Failed to delete lesson. Please try again.')
    }
  }

  const handleDownloadCalendar = () => {
    try {
      const calendarLessons: CalendarLesson[] = lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        scheduledAt: lesson.scheduledAt,
        duration: lesson.duration,
        joinLink: lesson.joinLink,
      }))
      downloadICS(calendarLessons, 'skillstream-upcoming-lessons.ics')
      toast.success('Calendar downloaded successfully')
    } catch (error: any) {
      console.error('Failed to download calendar:', error)
      toast.error('Failed to download calendar')
    }
  }

  // Calendar helper functions
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const getLessonsForDate = (day: number | null) => {
    if (day === null) return []
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.scheduledAt)
      return lessonDate.toDateString() === date.toDateString()
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Upcoming Lessons</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Upcoming Lessons</h1>
              <p className="text-muted-foreground">
                {isTeacher() 
                  ? 'Manage your scheduled lesson sessions'
                  : 'View your upcoming lesson sessions'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!loading && lessons.length > 0 && (
                <Button variant="outline" onClick={handleDownloadCalendar}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Calendar
                </Button>
              )}
              {isTeacher() && (
                <Button onClick={() => navigate('/lessons/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Lesson
                </Button>
              )}
            </div>
          </div>

          {/* Calendar View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={loading}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={loading}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  disabled={loading}
                >
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Week day headers */}
                  {weekDays.map((day) => (
                    <div key={day} className="text-center font-medium text-xs text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {getDaysInMonth().map((day, index) => {
                    const dayLessons = getLessonsForDate(day)
                    const isToday = day !== null && 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === new Date().toDateString()

                    return (
                      <div
                        key={index}
                        className={`min-h-[60px] border rounded p-1 text-xs ${
                          day === null ? 'bg-muted/20' : 'hover:bg-muted/50'
                        } ${isToday ? 'border-primary border-2 bg-primary/5' : ''}`}
                      >
                        {day !== null && (
                          <>
                            <div className={`font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                              {day}
                            </div>
                            <div className="space-y-0.5">
                              {dayLessons.slice(0, 2).map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1 py-0.5 rounded truncate"
                                  title={lesson.title}
                                >
                                  {lesson.title}
                                </div>
                              ))}
                              {dayLessons.length > 2 && (
                                <div className="text-[10px] text-muted-foreground px-1">
                                  +{dayLessons.length - 2}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        {lesson.subject && (
                          <CardDescription className="mt-1">{lesson.subject}</CardDescription>
                        )}
                      </div>
                      {isTeacher() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/lessons/${lesson.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(lesson.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lesson.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{formatDate(lesson.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span>{lesson.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {formatTime(lesson.scheduledAt)}
                        </Badge>
                      </div>
                    </div>

                    {lesson.joinLink && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(lesson.joinLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Lesson
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No upcoming lessons</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {isTeacher() 
                    ? 'Schedule your first lesson to get started'
                    : 'You have no upcoming lessons scheduled'}
                </p>
                {isTeacher() && (
                  <Button onClick={() => navigate('/lessons/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Lesson
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}

