import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import { DollarSign, TrendingUp, Users, UserPlus, Clock, Calendar, BookOpen, Plus, MessageSquare, CreditCard, ArrowRight, Loader2 } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LessonsAPI } from "@/api/lessons.api"
import { CoursesAPI } from "@/api/courses.api"
import { Course } from "@/api/types"
import { Button } from "@/components/ui/button"
import { TeacherEarningsAPI, EarningsStats } from "@/api/teacher-earnings.api"
import { useNavigate } from "react-router-dom"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"

interface UpcomingLesson {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  status: string
  joinLink?: string
  student?: {
    firstName?: string
    lastName?: string
    username: string
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const { settings } = useSystemSettings()
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [topCourses, setTopCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [earningsStats, setEarningsStats] = useState<EarningsStats | null>(null)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchUpcomingLessons = async () => {
      try {
        setLoading(true)
        const response = await LessonsAPI.getLessons({
          role: 'TEACHER',
          status: 'upcoming'
        })
        
        // Get quickLessons from response
        const quickLessons = response.data?.quickLessons || []
        
        // Sort by scheduledAt and take the next 5
        const sorted = quickLessons
          .filter((lesson: any) => new Date(lesson.scheduledAt) > new Date())
          .sort((a: any, b: any) => 
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
          .slice(0, 5)
        
        setUpcomingLessons(sorted)
      } catch (error: any) {
        console.error('Failed to fetch upcoming lessons:', error)
        // Don't redirect on 401 errors - just set empty data
        if (error?.response?.status === 401) {
          console.warn('Unauthorized - using empty data for development')
        }
        // Set empty array on error
        setUpcomingLessons([])
      } finally {
        setLoading(false)
      }
    }

    const fetchTopCourses = async () => {
      try {
        setCoursesLoading(true)
        // Fetch courses sorted by creation date or another metric
        // You can adjust the sorting logic based on what "top performing" means
        const response = await CoursesAPI.getCourses({
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        
        const courses = response.courses || []
        setTopCourses(courses.slice(0, 5))
      } catch (error: any) {
        console.error('Failed to fetch top courses:', error)
        // Don't redirect on 401 errors - just set empty data
        if (error?.response?.status === 401) {
          console.warn('Unauthorized - using empty data for development')
        }
        setTopCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }

    const fetchEarningsStats = async () => {
      try {
        setEarningsLoading(true)
        const stats = await TeacherEarningsAPI.getEarningsStats()
        setEarningsStats(stats)
      } catch (error: any) {
        console.error('Failed to fetch earnings stats:', error)
        // Don't redirect on 401 errors - just set null
        if (error?.response?.status === 401) {
          console.warn('Unauthorized - using empty data for development')
        }
        // Set null on error - will show loading or fallback
        setEarningsStats(null)
      } finally {
        setEarningsLoading(false)
      }
    }

    fetchUpcomingLessons()
    fetchTopCourses()
    fetchEarningsStats()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : earningsStats ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(earningsStats.totalEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(
                        calculatePercentageChange(
                          earningsStats.thisMonthEarnings,
                          earningsStats.lastMonthEarnings
                        )
                      )} from last month
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">
                      No earnings data available
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Earnings
                </CardTitle>
                <CreditCard className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ) : earningsStats ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(earningsStats.pendingEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting payout
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">
                      No pending earnings
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  This Month
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : earningsStats ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(earningsStats.thisMonthEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(
                        calculatePercentageChange(
                          earningsStats.thisMonthEarnings,
                          earningsStats.lastMonthEarnings
                        )
                      )} vs last month
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">
                      No earnings this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paid Out
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : earningsStats ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(earningsStats.paidEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total paid earnings
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">
                      No paid earnings yet
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Top Courses Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Quick Actions - 3 columns */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {settings?.allowCourseCreation !== false && (
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-3"
                    onClick={() => navigate('/courses/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Create New Course</div>
                      <div className="text-xs text-muted-foreground">Start building a new course</div>
                    </div>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/lessons/new')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Schedule Private Lesson</div>
                    <div className="text-xs text-muted-foreground">Book a one-on-one session</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    if (topCourses.length > 0) {
                      navigate(`/courses/${topCourses[0].id}/announcements`)
                    } else {
                      navigate('/courses')
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Post Announcement</div>
                    <div className="text-xs text-muted-foreground">Share updates with students</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/earnings')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">View Earnings</div>
                    <div className="text-xs text-muted-foreground">Check your revenue and payouts</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Top Performing Courses - 4 columns */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>
                  Your most recent and popular courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Skeleton className="w-16 h-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No courses yet</p>
                    {settings?.allowCourseCreation !== false && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => navigate('/courses/new')}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Create Your First Course
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all group"
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{course.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{course.difficulty}</span>
                            <span>•</span>
                            <span>{course.duration} min</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">${course.price}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(`/courses/${course.id}/builder`)}
                        >
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Lessons Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Lessons</CardTitle>
              <CardDescription>
                Your next scheduled lessons with students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-9 w-20 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : upcomingLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming lessons scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{lesson.title}</h4>
                          <Badge variant={getStatusColor(lesson.status)}>
                            {lesson.status}
                          </Badge>
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(lesson.scheduledAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{lesson.duration} min</span>
                          </div>
                          {lesson.student && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {lesson.student.firstName && lesson.student.lastName
                                  ? `${lesson.student.firstName} ${lesson.student.lastName}`
                                  : lesson.student.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {lesson.joinLink && (
                        <a
                          href={lesson.joinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

