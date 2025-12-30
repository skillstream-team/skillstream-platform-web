import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import { 
  BookOpen, 
  Clock, 
  Award,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Activity
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/api/auth-utils"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ProgressAPI } from "@/api/progress.api"
import { CertificatesAPI } from "@/api/certificates.api"
import { Course } from "@/api/types"
import { useNavigate } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CourseWithProgress extends Course {
  progress?: {
    completionPercentage: number
    status: 'not-started' | 'in-progress' | 'completed'
    lastAccessedAt?: string
    completedAt?: string
  }
}

export function LearningAnalytics() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'year'>('month')
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    totalCertificates: 0,
    averageCompletion: 0,
    totalLearningTime: 0,
  })
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (!hasFetched.current) return
    calculateStats()
  }, [timeRange, courses])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch enrollments
      const enrollmentsResponse = await EnrollmentsAPI.getEnrollments({
        limit: 100,
      })
      const enrollments = enrollmentsResponse.enrollments || []
      
      // Fetch progress for all enrolled courses
      const coursesWithProgress: CourseWithProgress[] = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            const progress = await ProgressAPI.getCourseProgress(
              enrollment.courseId, 
              currentUser?.id
            )
            return {
              ...enrollment.course,
              progress: progress || undefined,
            }
          } catch (error) {
            return {
              ...enrollment.course,
              progress: undefined,
            }
          }
        })
      )
      
      setCourses(coursesWithProgress.filter(c => c.id))
      
      // Fetch certificates count
      try {
        const certs = await CertificatesAPI.getCertificates({ userId: currentUser?.id })
        const certsArray = Array.isArray(certs) ? certs : []
        setStats(prev => ({ ...prev, totalCertificates: certsArray.length }))
      } catch (error) {
        // Ignore errors
      }
      
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      if (error?.response?.status !== 401) {
        // Handle error
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    let cutoffDate: Date | null = null
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoffDate = null
    }

    const filteredCourses = cutoffDate 
      ? courses.filter(c => {
          const date = c.progress?.lastAccessedAt || c.createdAt
          return new Date(date) >= cutoffDate!
        })
      : courses

    const completed = filteredCourses.filter(c => 
      c.progress?.status === 'completed'
    ).length
    const inProgress = filteredCourses.filter(c => 
      c.progress?.status === 'in-progress' || 
      (c.progress && c.progress.completionPercentage > 0 && c.progress.completionPercentage < 100)
    ).length
    const notStarted = filteredCourses.filter(c => 
      !c.progress || c.progress.completionPercentage === 0
    ).length

    const totalCompletion = filteredCourses.reduce((sum, c) => 
      sum + (c.progress?.completionPercentage || 0), 0
    )
    const averageCompletion = filteredCourses.length > 0 
      ? totalCompletion / filteredCourses.length 
      : 0

    setStats({
      totalCourses: filteredCourses.length,
      completedCourses: completed,
      inProgressCourses: inProgress,
      notStartedCourses: notStarted,
      totalCertificates: stats.totalCertificates,
      averageCompletion,
      totalLearningTime: 0, // Would need time tracking API
    })
  }

  const getTopCourses = () => {
    return [...courses]
      .sort((a, b) => (b.progress?.completionPercentage || 0) - (a.progress?.completionPercentage || 0))
      .slice(0, 5)
  }

  const getRecentlyCompleted = () => {
    return courses
      .filter(c => c.progress?.status === 'completed')
      .sort((a, b) => {
        const aDate = a.progress?.completedAt || ''
        const bDate = b.progress?.completedAt || ''
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .slice(0, 5)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Learning Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Learning Analytics</h1>
                <p className="text-lg text-muted-foreground">
                  Track your learning progress and performance
                </p>
              </div>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled courses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    Courses finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <PlayCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgressCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently learning
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.averageCompletion)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Completion rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Analytics */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Progress Breakdown */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Breakdown</CardTitle>
                    <CardDescription>Status of your enrolled courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stats.completedCourses}</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 transition-all"
                              style={{ width: `${stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stats.inProgressCourses}</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-600 transition-all"
                              style={{ width: `${stats.totalCourses > 0 ? (stats.inProgressCourses / stats.totalCourses) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Not Started</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stats.notStartedCourses}</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-400 transition-all"
                              style={{ width: `${stats.totalCourses > 0 ? (stats.notStartedCourses / stats.totalCourses) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>Your learning milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Certificates Earned</div>
                            <div className="text-sm text-muted-foreground">
                              {stats.totalCertificates} certificates
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/certificates')}
                        >
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Target className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Courses Completed</div>
                            <div className="text-sm text-muted-foreground">
                              {stats.completedCourses} courses finished
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Courses */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Courses by Progress</CardTitle>
                  <CardDescription>Your most progressed courses</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : getTopCourses().length > 0 ? (
                    <div className="space-y-4">
                      {getTopCourses().map((course, index) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/courses/${course.id}/learn`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{course.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {Math.round(course.progress?.completionPercentage || 0)}% complete
                              </div>
                            </div>
                          </div>
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${course.progress?.completionPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No courses data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Courses</CardTitle>
                  <CardDescription>Complete overview of your enrolled courses</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : courses.length > 0 ? (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/courses/${course.id}/learn`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {course.thumbnailUrl ? (
                              <img 
                                src={course.thumbnailUrl} 
                                alt={course.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-semibold mb-1">{course.title}</div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{Math.round(course.progress?.completionPercentage || 0)}% complete</span>
                                <span>•</span>
                                <span>{course.duration} min</span>
                                {course.progress?.status && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {course.progress.status}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${course.progress?.completionPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Enroll in courses to start tracking your progress
                      </p>
                      <Button onClick={() => navigate('/courses')}>
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recently Completed</CardTitle>
                  <CardDescription>Your latest course completions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : getRecentlyCompleted().length > 0 ? (
                    <div className="space-y-4">
                      {getRecentlyCompleted().map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/courses/${course.id}/learn`)}
                        >
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
                              <Award className="h-10 w-10 text-green-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold mb-1">{course.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Completed {course.progress?.completedAt && new Date(course.progress.completedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <Award className="h-6 w-6 text-green-600" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2">No completed courses yet</h3>
                      <p className="text-muted-foreground">
                        Complete courses to see your achievements here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

