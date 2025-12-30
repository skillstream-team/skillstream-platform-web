import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useParams } from "react-router-dom"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Filter,
  ChevronDown,
  Download,
  Activity
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { CoursesAPI } from "@/api/courses.api"
import { ProgressAPI } from "@/api/progress.api"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"

export function CourseActivity() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBy, setFilterBy] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current || !courseId) return
    hasFetched.current = true

    fetchData()
  }, [courseId])

  useEffect(() => {
    if (!hasFetched.current || !courseId) return
    // Reset to page 1 when filter changes
    if (pagination.page === 1) {
      fetchData()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBy])

  useEffect(() => {
    if (!hasFetched.current || !courseId) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchData = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const [courseData, enrollmentsData] = await Promise.all([
        CoursesAPI.getCourse(courseId),
        CoursesAPI.getCourseEnrollments(courseId, {
          page: pagination.page,
          limit: pagination.limit,
        })
      ])
      setCourse(courseData)
      setEnrollments(enrollmentsData.enrollments || [])
      setPagination(enrollmentsData.pagination)
    } catch (error: any) {
      console.error('Failed to fetch course activity:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setEnrollments([])
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        )
    }
  }

  // Filter enrollments locally (filterBy is handled client-side)
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filterBy === 'all') return true
    return enrollment.progress?.status === filterBy
  })

  // Calculate stats (use pagination total if available)
  const totalEnrollments = pagination.total > 0 ? pagination.total : enrollments.length
  const completedCount = enrollments.filter(e => e.progress?.status === 'completed').length
  const inProgressCount = enrollments.filter(e => e.progress?.status === 'in-progress').length
  const averageProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + (e.progress?.completionPercentage || 0), 0) / enrollments.length
    : 0

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
                <BreadcrumbLink asChild>
                  <Link to="/students/enrollments">Enrollments</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Course Activity</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {course?.title || 'Course Activity'}
              </h1>
              <p className="text-muted-foreground">
                Track student progress and engagement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterBy('all')}>
                    All Students
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('completed')}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('in-progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('not-started')}>
                    Not Started
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Enrollments
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Students enrolled
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">
                  Active learners
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Progress
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average completion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Student Progress List */}
          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>
                View individual student progress and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {filteredEnrollments.map((enrollment) => {
                    const student = enrollment.student || {}
                    const progress = enrollment.progress || { completionPercentage: 0, status: 'not-started' }
                    const initials = student.firstName && student.lastName
                      ? `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
                      : student.username?.substring(0, 2).toUpperCase() || 'S'

                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : student.username || 'Unknown Student'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                            <div className="mt-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progress.completionPercentage || 0}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {progress.completionPercentage || 0}% complete
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(progress.status)}
                          <p className="text-sm text-muted-foreground">
                            Enrolled {formatDate(enrollment.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No enrollments found</p>
                  <p className="text-sm mt-2">Student enrollments will appear here</p>
                </div>
              )}

              {/* Pagination */}
              {!loading && filteredEnrollments.length > 0 && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

