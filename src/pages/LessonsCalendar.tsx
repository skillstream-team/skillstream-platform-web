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
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { LessonsAPI } from "@/api/lessons.api"
import { CalendarAPI, CalendarEvent } from "@/api/calendar.api"
import { useNavigate } from "react-router-dom"
import { isTeacher } from "@/api/auth-utils"

export function LessonsCalendar() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<any[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      // Determine role for API call
      const role = isTeacher() ? 'TEACHER' : 'STUDENT'
      const [lessonsResponse, eventsResponse] = await Promise.all([
        LessonsAPI.getLessons({ role }),
        CalendarAPI.getEvents({
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          type: 'lesson'
        })
      ])

      setLessons(lessonsResponse.data?.quickLessons || [])
      setEvents(eventsResponse.events || [])
    } catch (error: any) {
      console.error('Failed to fetch calendar data:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setLessons([])
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
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
    hasFetched.current = false
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    hasFetched.current = false
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    hasFetched.current = false
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
                <BreadcrumbPage>Lessons Calendar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lessons Calendar</h1>
              <p className="text-muted-foreground">
                {isTeacher() 
                  ? 'View and manage your lesson schedule'
                  : 'View your lesson schedule'}
              </p>
            </div>
            {isTeacher() && (
              <Button onClick={() => navigate('/lessons/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Lesson
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Week day headers */}
                  {weekDays.map((day) => (
                    <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
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
                        className={`min-h-[100px] border rounded-lg p-2 ${
                          day === null ? 'bg-muted/30' : 'hover:bg-muted/50'
                        } ${isToday ? 'border-primary border-2' : ''}`}
                      >
                        {day !== null && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayLessons.slice(0, 2).map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="text-xs bg-primary/10 text-primary p-1 rounded truncate cursor-pointer hover:bg-primary/20"
                                  title={lesson.title}
                                >
                                  {lesson.title}
                                </div>
                              ))}
                              {dayLessons.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayLessons.length - 2} more
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

