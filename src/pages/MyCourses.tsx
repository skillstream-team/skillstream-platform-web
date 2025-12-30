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
  PlayCircle,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  Award,
  Calendar
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ProgressAPI } from "@/api/progress.api"
import { CoursesAPI } from "@/api/courses.api"
import { Course } from "@/api/types"
import { getCurrentUser, isTeacher } from "@/api/auth-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CourseWithProgress extends Course {
  progress?: {
    completionPercentage: number
    status: 'not-started' | 'in-progress' | 'completed'
    lastAccessedAt?: string
    completedAt?: string
  }
  enrollmentId?: string
  enrolledAt?: string
}

export function MyCourses() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'all'
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('recent')
  const isFetching = useRef(false)

  // Use improved refresh hook with deduplication
  useRefreshOnNavigation(() => {
    if (!isFetching.current) {
      fetchCourses()
    }
  }, {
    refreshOnVisible: true,
    refreshOnLocationChange: true,
    refreshOnStateFlag: true,
    cacheKey: `my-courses-${currentTab}-${searchQuery}-${sortBy}`,
    debounceMs: 500,
  })

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, currentTab, searchQuery, sortBy])

  const fetchCourses = async () => {
    // Prevent duplicate calls
    if (isFetching.current) {
      return
    }
    
    try {
      isFetching.current = true
      setLoading(true)
      
      // If user is a teacher, fetch courses they created
      if (isTeacher() && currentUser?.id) {
        const response = await CoursesAPI.getCourses({
          instructorId: currentUser.id,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        
        const coursesWithProgress: CourseWithProgress[] = (response.courses || []).map((course: Course) => ({
          ...course,
          // Teachers don't have progress on their own courses
        }))
        
        setCourses(coursesWithProgress)
        return
      }
      
      // For students, fetch enrollments
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
          enrolledAt: enrollment.createdAt,
        }))
        .filter((course: CourseWithProgress) => course.id) // Filter out null courses
      
      setCourses(coursesWithProgress)
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setCourses([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }

  const filterAndSortCourses = () => {
    let filtered = [...courses]

    // Filter by tab
    if (currentTab === 'in-progress') {
      filtered = filtered.filter(c => 
        c.progress?.status === 'in-progress' || 
        (c.progress && c.progress.completionPercentage > 0 && c.progress.completionPercentage < 100)
      )
    } else if (currentTab === 'completed') {
      filtered = filtered.filter(c => c.progress?.status === 'completed')
    }
    // 'all' shows everything

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const aDate = a.progress?.lastAccessedAt || a.enrolledAt || a.createdAt
          const bDate = b.progress?.lastAccessedAt || b.enrolledAt || b.createdAt
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'progress':
          const aProgress = a.progress?.completionPercentage || 0
          const bProgress = b.progress?.completionPercentage || 0
          return bProgress - aProgress
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTabCount = (tab: string) => {
    if (tab === 'all') return courses.length
    if (tab === 'in-progress') {
      return courses.filter(c => 
        c.progress?.status === 'in-progress' || 
        (c.progress && c.progress.completionPercentage > 0 && c.progress.completionPercentage < 100)
      ).length
    }
    if (tab === 'completed') {
      return courses.filter(c => c.progress?.status === 'completed').length
    }
    return 0
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage and continue your learning
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b">
            <Button
              variant={currentTab === 'all' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('all')}
              className="rounded-b-none"
            >
              All ({getTabCount('all')})
            </Button>
            <Button
              variant={currentTab === 'in-progress' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('in-progress')}
              className="rounded-b-none"
            >
              In Progress ({getTabCount('in-progress')})
            </Button>
            <Button
              variant={currentTab === 'completed' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('completed')}
              className="rounded-b-none"
            >
              Completed ({getTabCount('completed')})
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'title' ? 'Title' : 'Progress'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                  Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('progress')}>
                  Progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/courses/${course.id}/learn`)}
                >
                  {course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-2 flex-1">{course.title}</CardTitle>
                      {course.progress?.status === 'completed' && (
                        <Award className="h-5 w-5 text-yellow-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3" />
                      {course.duration} min
                      {course.instructor && (
                        <>
                          <span className="mx-1">•</span>
                          {course.instructor.firstName || course.instructor.username}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {course.progress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round(course.progress.completionPercentage || 0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all rounded-full"
                            style={{ width: `${course.progress.completionPercentage || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {course.progress.lastAccessedAt ? (
                            <span>Last accessed {formatDate(course.progress.lastAccessedAt)}</span>
                          ) : course.enrolledAt ? (
                            <span>Enrolled {formatDate(course.enrolledAt)}</span>
                          ) : null}
                          {course.progress.status === 'completed' && course.progress.completedAt && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                          {course.progress.status === 'in-progress' && (
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-3 w-3" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!course.progress && course.enrolledAt && (
                      <div className="text-xs text-muted-foreground">
                        Enrolled {formatDate(course.enrolledAt)}
                      </div>
                    )}
                    <Button 
                      className="w-full mt-4" 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/courses/${course.id}/learn`)
                      }}
                    >
                      {course.progress?.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'No courses found' : currentTab === 'completed' ? 'No completed courses yet' : currentTab === 'in-progress' ? 'No courses in progress' : 'No courses enrolled'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Browse courses to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

