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
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { 
  BookOpen, 
  Clock, 
  PlayCircle,
  ArrowRight,
  Bookmark,
  Star,
  TrendingUp,
  Flame,
  Target,
  Award,
  Calendar,
  Zap,
  TrendingDown,
  Users,
  ThumbsUp,
  BarChart3,
  CheckCircle2
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ProgressAPI } from "@/api/progress.api"
import { WishlistAPI } from "@/api/wishlist.api"
import { CoursesAPI } from "@/api/courses.api"
import { LearningPathsAPI } from "@/api/learning-paths.api"
import { CertificatesAPI } from "@/api/certificates.api"
import { Course } from "@/api/types"
import { getCurrentUser } from "@/api/auth-utils"

interface CourseWithProgress extends Course {
  progress?: {
    completionPercentage: number
    status: 'not-started' | 'in-progress' | 'completed'
    lastAccessedAt?: string
  }
  enrollmentId?: string
}

export function StudentDashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [continueLearning, setContinueLearning] = useState<CourseWithProgress[]>([])
  const [recentlyCompleted, setRecentlyCompleted] = useState<CourseWithProgress[]>([])
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([])
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([])
  const [learningPaths, setLearningPaths] = useState<any[]>([])
  const [wishlistCourses, setWishlistCourses] = useState<Course[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<CourseWithProgress[]>([])
  const [learningStats, setLearningStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLearningTime: 0,
  })
  const [learningStreak, setLearningStreak] = useState(0)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchDashboardData()
  }, [])

  const getUserDisplayName = () => {
    if (!currentUser) return 'there'
    if (currentUser.firstName) {
      return currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.firstName
    }
    return currentUser.username || currentUser.email?.split('@')[0] || 'there'
  }

  const isFirstTime = () => {
    return learningStats.totalCourses === 0
  }
  
  const calculateLearningStreak = (courses: CourseWithProgress[]): number => {
    // Get all learning activity dates from progress
    const activityDates = new Set<string>()
    courses.forEach(course => {
      if (course.progress?.lastAccessedAt) {
        const date = new Date(course.progress.lastAccessedAt)
        const dateStr = date.toDateString()
        activityDates.add(dateStr)
      }
    })
    
    // Calculate consecutive days from today backwards
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let currentDate = new Date(today)
    
    while (true) {
      const dateStr = currentDate.toDateString()
      if (activityDates.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        // If today has no activity, check if yesterday had activity to start streak
        if (streak === 0 && currentDate.getTime() === today.getTime()) {
          currentDate.setDate(currentDate.getDate() - 1)
          continue
        }
        break
      }
    }
    
    return streak
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch enrollments
      const enrollmentsResponse = await EnrollmentsAPI.getEnrollments({
        limit: 100,
      })
      const enrollments = enrollmentsResponse.enrollments || []
      
      // Fetch progress for all enrolled courses
      const progressMap = new Map<string, any>()
      for (const enrollment of enrollments) {
        try {
          const progress = await ProgressAPI.getCourseProgress(enrollment.courseId, currentUser?.id)
          if (progress) {
            progressMap.set(enrollment.courseId, progress)
          }
        } catch (error) {
          // Progress might not exist yet
        }
      }
      
      // Combine enrollments with progress
      const coursesWithProgress: CourseWithProgress[] = enrollments
        .map((enrollment: any) => ({
          ...enrollment.course,
          progress: progressMap.get(enrollment.courseId),
          enrollmentId: enrollment.id,
        }))
        .filter((course: CourseWithProgress) => course.id)
      
      // Calculate stats
      const completed = coursesWithProgress.filter(c => c.progress?.status === 'completed').length
      const inProgress = coursesWithProgress.filter(c => 
        c.progress?.status === 'in-progress' || 
        (c.progress && c.progress.completionPercentage > 0 && c.progress.completionPercentage < 100)
      ).length
      
      setLearningStats({
        totalCourses: coursesWithProgress.length,
        completedCourses: completed,
        inProgressCourses: inProgress,
        totalLearningTime: 0, // Would need analytics API
      })
      
      // Calculate learning streak
      const streak = calculateLearningStreak(coursesWithProgress)
      setLearningStreak(streak)
      
      // Sort by last accessed or enrollment date
      const sortedCourses = coursesWithProgress.sort((a, b) => {
        const aDate = a.progress?.lastAccessedAt || a.createdAt
        const bDate = b.progress?.lastAccessedAt || b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      
      // Continue Learning: In-progress courses, sorted by most recently accessed
      const inProgressCourses = sortedCourses.filter(c => 
        c.progress?.status === 'in-progress' || 
        (c.progress && c.progress.completionPercentage > 0 && c.progress.completionPercentage < 100)
      ).slice(0, 4)
      setContinueLearning(inProgressCourses)
      
      // Recently Viewed: All courses sorted by last accessed, excluding in-progress
      const recentlyViewedCourses = sortedCourses
        .filter(c => !inProgressCourses.some(ip => ip.id === c.id))
        .slice(0, 4)
      setRecentlyViewed(recentlyViewedCourses)
      
      // Recently Completed
      const completedCourses = sortedCourses.filter(c => c.progress?.status === 'completed')
        .slice(0, 3)
      setRecentlyCompleted(completedCourses)
      
      // Fetch recommended courses
      try {
        const recommendedResponse = await CoursesAPI.getCourses({
          limit: 8,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        setRecommendedCourses(recommendedResponse.courses || [])
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch recommended courses:', error)
        }
      }
      
      // Fetch trending courses (sorted by rating or enrollment count)
      try {
        const trendingResponse = await CoursesAPI.getCourses({
          limit: 4,
          sortBy: 'rating',
          sortOrder: 'desc',
        })
        setTrendingCourses(trendingResponse.courses || [])
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch trending courses:', error)
        }
      }
      
      // Fetch learning paths
      try {
        const pathsResponse = await LearningPathsAPI.getLearningPaths({ limit: 3 })
        setLearningPaths(pathsResponse.learningPaths || [])
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch learning paths:', error)
        }
      }
      
      // Fetch wishlist
      try {
        const wishlistResponse = await WishlistAPI.getWishlist({ limit: 4 })
        setWishlistCourses(wishlistResponse.courses || [])
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch wishlist:', error)
        }
      }
      
      // Fetch certificates
      try {
        // TODO: Implement getCertificates API endpoint
        const certsResponse: any[] = []
        setCertificates(Array.isArray(certsResponse) ? certsResponse : [])
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch certificates:', error)
        }
        setCertificates([])
      }
      
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              {isFirstTime() ? (
                <>Welcome, {getUserDisplayName()}!</>
              ) : (
                <>Welcome Back, {getUserDisplayName()}!</>
              )}
            </h1>
          </div>

          {/* Quick Stats Bar - Subtle and Clean */}
          {learningStats.totalCourses > 0 && (
            <div className="grid grid-cols-5 gap-4 mb-8">
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{learningStreak}</div>
                      <div className="text-xs text-muted-foreground">Day Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{learningStats.totalCourses}</div>
                      <div className="text-xs text-muted-foreground">Total Courses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{learningStats.completedCourses}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <PlayCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{learningStats.inProgressCourses}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{certificates.length}</div>
                      <div className="text-xs text-muted-foreground">Certificates</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Continue Learning Section */}
          {continueLearning.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Continue Learning</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Pick up where you left off
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/my-courses')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {continueLearning.map((course) => (
                    <Card 
                      key={course.id} 
                      className="group cursor-pointer overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg"
                      onClick={() => navigate(`/courses/${course.id}/learn`)}
                    >
                      <div className="relative">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-blue-400" />
                          </div>
                        )}
                        {/* Progress Bar Overlay */}
                        {course.progress && course.progress.completionPercentage > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                            <div 
                              className="h-full bg-white transition-all"
                              style={{ width: `${course.progress.completionPercentage}%` }}
                            />
                          </div>
                        )}
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/95 rounded-full p-4">
                              <PlayCircle className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {course.duration} min
                            </div>
                            {course.progress && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-foreground">
                                  {Math.round(course.progress.completionPercentage || 0)}% complete
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Three Column Layout */}
          <div className="grid lg:grid-cols-12 gap-8 mb-12">
            {/* Learning Paths - Left Column */}
            {learningPaths.length > 0 && (
              <section className="lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Learning Paths</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/learning-paths')}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {learningPaths.map((path) => (
                    <Card 
                      key={path.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/learning-paths/${path.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                              {path.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {path.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {path.courseIds && (
                                <span>{path.courseIds.length} courses</span>
                              )}
                              {path.estimatedDuration && (
                                <>
                                  <span>•</span>
                                  <span>{path.estimatedDuration}h</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Middle and Right Columns */}
            <div className={learningPaths.length > 0 ? "lg:col-span-9 space-y-8" : "lg:col-span-12 space-y-8"}>
              {/* Top Row: Recently Completed & Certificates */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Recently Completed */}
                {recentlyCompleted.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Recently Completed</h2>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/my-courses?tab=completed')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {recentlyCompleted.map((course) => (
                        <Card 
                          key={course.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => navigate(`/courses/${course.id}/learn`)}
                        >
                          <div className="flex gap-4 p-4">
                            {course.thumbnailUrl ? (
                              <img 
                                src={course.thumbnailUrl} 
                                alt={course.title}
                                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center rounded-lg flex-shrink-0">
                                <Award className="h-8 w-8 text-green-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors flex-1">
                                  {course.title}
                                </h3>
                                <Award className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Completed {(course.progress as any)?.completedAt && new Date((course.progress as any).completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Certificates */}
                {certificates.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Certificates</h2>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {certificates.slice(0, 3).map((cert) => (
                        <Card key={cert.id} className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <Award className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1">
                                  {cert.course?.title || cert.courseName || 'Course Certificate'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Earned {cert.issuedAt && new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Trending Courses & Wishlist Row */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Trending Courses */}
                {trendingCourses.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <h2 className="text-xl font-semibold">Trending Now</h2>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/courses?sortBy=popular')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      {trendingCourses.map((course) => (
                        <Card 
                          key={course.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title}
                              className="w-full h-24 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
                              <Flame className="h-8 w-8 text-orange-400" />
                            </div>
                          )}
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-xs mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {course.duration} min
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Wishlist */}
                {wishlistCourses.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-purple-500" />
                        <h2 className="text-xl font-semibold">My Wishlist</h2>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/my-courses?tab=wishlist')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      {wishlistCourses.map((course) => (
                        <Card 
                          key={course.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title}
                              className="w-full h-24 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                              <Bookmark className="h-8 w-8 text-purple-400" />
                            </div>
                          )}
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-xs mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {course.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {course.duration} min
                              </div>
                              {course.price !== undefined && (
                                <span className="font-medium">
                                  {course.price === 0 ? 'Free' : `$${course.price}`}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* Recently Viewed Section */}
          {recentlyViewed.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Recently Viewed</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Courses you've visited recently
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/my-courses')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {recentlyViewed.map((course) => (
                  <Card 
                    key={course.id} 
                    className="group cursor-pointer overflow-hidden border hover:border-primary/50 transition-all hover:shadow-lg"
                    onClick={() => navigate(`/courses/${course.id}/learn`)}
                  >
                    <div className="relative">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <Clock className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {course.progress && course.progress.completionPercentage > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                          <div 
                            className="h-full bg-white transition-all"
                            style={{ width: `${course.progress.completionPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration} min
                        </div>
                        {course.progress && (
                          <span className="font-medium">
                            {Math.round(course.progress.completionPercentage || 0)}% complete
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Courses Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Recommended for You</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Discover courses tailored to your interests
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/courses')}
                className="text-muted-foreground hover:text-foreground"
              >
                Browse All Courses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendedCourses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {recommendedCourses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="group cursor-pointer overflow-hidden border hover:border-primary/50 transition-all hover:shadow-lg"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="relative">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                          <TrendingUp className="h-12 w-12 text-purple-400" />
                        </div>
                      )}
                      {/* Difficulty Badge */}
                      {course.difficulty && (
                        <div className="absolute top-3 left-3">
                          <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium">
                            {course.difficulty}
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration} min
                        </div>
                        {course.price !== undefined && (
                          <div className="text-sm font-semibold">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start exploring courses to get personalized recommendations
                  </p>
                  <Button onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Empty State - No courses in progress */}
          {!loading && continueLearning.length === 0 && (
            <section className="mb-12">
              <Card className="py-16 border-dashed">
                <CardContent className="text-center">
                  <PlayCircle className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
                  <h2 className="text-2xl font-semibold mb-3">Ready to start learning?</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Enroll in a course to begin your learning journey. Your progress will appear here so you can easily continue where you left off.
                  </p>
                  <Button size="lg" onClick={() => navigate('/courses')}>
                    Browse Courses
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
