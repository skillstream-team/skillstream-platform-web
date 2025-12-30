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
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  BookOpen, 
  Search, 
  MoreVertical,
  Mail,
  Calendar,
  DollarSign,
  Filter,
  ChevronDown,
  TrendingUp,
  UserPlus,
  CheckCircle,
  Clock,
  Eye,
  ExternalLink
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { CoursesAPI } from "@/api/courses.api"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"

interface Enrollment {
  id: string
  courseId: string
  studentId: string
  student: {
    id: string
    username: string
    email: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  course: {
    id: string
    title: string
    thumbnailUrl?: string
    price: number
  }
  payment?: {
    id: string
    amount: number
    status: string
    transactionId: string
  }
  progress?: {
    completionPercentage: number
    status: 'not-started' | 'in-progress' | 'completed'
  }
  createdAt: string
}


export function Enrollments() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
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
    if (hasFetched.current) return
    hasFetched.current = true
    fetchEnrollments()
  }, [])

  useEffect(() => {
    if (!hasFetched.current) return
    // Reset to page 1 when filters change
    if (pagination.page === 1) {
      fetchEnrollments()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterBy, courseFilter, sortBy])

  useEffect(() => {
    if (!hasFetched.current) return
    fetchEnrollments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (courseFilter !== "all") {
        params.courseId = courseFilter
      }
      
      const response = await EnrollmentsAPI.getEnrollments(params)
      
      // Group enrollments by course
      const grouped = (response.enrollments || []).reduce((acc: any, enrollment: any) => {
        const courseId = enrollment.courseId
        if (!acc[courseId]) {
          acc[courseId] = {
            course: enrollment.course || { id: courseId, title: 'Unknown Course' },
            enrollments: [],
          }
        }
        acc[courseId].enrollments.push(enrollment)
        return acc
      }, {})
      setEnrollments(Object.values(grouped) as any)
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch enrollments:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      } else {
        toast.error(error?.response?.data?.message || 'Failed to load enrollments. Please try again.')
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

  // Calculate statistics from fetched data
  const currentEnrollments = enrollments.flatMap((g: any) => g.enrollments || [])
  const totalEnrollments = currentEnrollments.length
  const completedPayments = currentEnrollments.filter((e: any) => e.payment?.status === "completed").length
  const totalRevenue = currentEnrollments
    .filter((e: any) => e.payment?.status === "completed")
    .reduce((sum: number, e: any) => sum + (e.payment?.amount || 0), 0)
  const recentEnrollments = currentEnrollments.filter((e: any) => {
    const daysSince = Math.floor(
      (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSince <= 7
  }).length

  // Group enrollments by course
  const enrollmentsByCourse = enrollments

  // Get unique courses for filter
  const uniqueCourses = enrollments.map((g: any) => g.course).filter((c: any, index: number, self: any[]) => 
    index === self.findIndex((t: any) => t.id === c.id)
  )

  // Filter enrollments locally (search is handled client-side since API may not support all filters)
  const filteredEnrollments = currentEnrollments.filter((enrollment: any) => {
    if (searchQuery) {
      const matchesSearch = 
        enrollment.student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (enrollment.student.firstName && enrollment.student.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (enrollment.student.lastName && enrollment.student.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      
      if (!matchesSearch) return false
    }

    if (filterBy === "completed" && enrollment.payment?.status !== "completed") return false
    if (filterBy === "pending" && enrollment.payment?.status !== "pending") return false
    if (filterBy === "recent") {
      const daysSince = Math.floor(
        (Date.now() - new Date(enrollment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince > 7) return false
    }

    // courseFilter is handled by API, so we don't filter here
    return true
  })

  // Group filtered enrollments by course
  const filteredEnrollmentsByCourse = filteredEnrollments.reduce((acc, enrollment) => {
    const courseId = enrollment.course.id
    if (!acc[courseId]) {
      acc[courseId] = {
        course: enrollment.course,
        enrollments: []
      }
    }
    acc[courseId].enrollments.push(enrollment)
    return acc
  }, {} as Record<string, { course: Enrollment["course"], enrollments: Enrollment[] }>)

  // Sort courses
  const sortedCourses = Object.values(filteredEnrollmentsByCourse).sort((a, b) => {
    switch (sortBy) {
      case "course":
        return a.course.title.localeCompare(b.course.title)
      case "enrollments":
        return b.enrollments.length - a.enrollments.length
      case "revenue":
        const revenueA = a.enrollments
          .filter(e => e.payment?.status === "completed")
          .reduce((sum, e) => sum + (e.payment?.amount || 0), 0)
        const revenueB = b.enrollments
          .filter(e => e.payment?.status === "completed")
          .reduce((sum, e) => sum + (e.payment?.amount || 0), 0)
        return revenueB - revenueA
      default:
        return b.enrollments.length - a.enrollments.length
    }
  })

  // Sort students within each course
  sortedCourses.forEach(courseGroup => {
    courseGroup.enrollments.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "student":
          const nameA = `${a.student.firstName || ""} ${a.student.lastName || ""}`.trim() || a.student.username
          const nameB = `${b.student.firstName || ""} ${b.student.lastName || ""}`.trim() || b.student.username
          return nameA.localeCompare(nameB)
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getInitials = (student: Enrollment["student"]) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
    }
    return student.username.substring(0, 2).toUpperCase()
  }

  const getDisplayName = (student: Enrollment["student"]) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`
    }
    return student.username
  }

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1 text-yellow-600" />Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
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
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/students">Students</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Enrollments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Header with Statistics */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/30 to-indigo-50/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Course Enrollments</CardTitle>
                  <CardDescription>
                    View and manage all student enrollments in your courses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BookOpen className="h-4 w-4 text-amber-600" />
                    Total Enrollments
                  </div>
                  <p className="text-2xl font-bold">{totalEnrollments}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Completed Payments
                  </div>
                  <p className="text-2xl font-bold">{completedPayments}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Total Revenue
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Recent (7 days)
                  </div>
                  <p className="text-2xl font-bold">{recentEnrollments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enrollments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterBy("all")}>
                    All Enrollments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("completed")}>
                    Completed Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("pending")}>
                    Pending Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("recent")}>
                    Recent (7 days)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Sort By
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("course")}>
                    Course Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("enrollments")}>
                    Most Enrollments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("revenue")}>
                    Highest Revenue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Recent Enrollments First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("student")}>
                    Student Name (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enrollments by Course */}
          {sortedCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No enrollments found</p>
                <p className="text-sm text-muted-foreground text-center">
                  {searchQuery
                    ? "Try adjusting your search or filter criteria"
                    : "Enrollments will appear here when students enroll in your courses."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedCourses.map((courseGroup) => {
                const courseRevenue = courseGroup.enrollments
                  .filter(e => e.payment?.status === "completed")
                  .reduce((sum, e) => sum + (e.payment?.amount || 0), 0)
                const completedPayments = courseGroup.enrollments.filter(e => e.payment?.status === "completed").length

                return (
                  <Card key={courseGroup.course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">{courseGroup.course.title}</h2>
                            <Badge variant="outline">
                              {courseGroup.enrollments.length} {courseGroup.enrollments.length === 1 ? "student" : "students"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span>{formatCurrency(courseRevenue)} revenue</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4 text-amber-600" />
                              <span>{formatCurrency(courseGroup.course.price)} per enrollment</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/courses/${courseGroup.course.id}/grading`}>
                              <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                              Grading Book
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/courses/${courseGroup.course.id}/activity`}>
                              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                              Course Activity
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="space-y-3">
                        {courseGroup.enrollments.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            {/* Student Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={enrollment.student.avatar} alt={getDisplayName(enrollment.student)} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials(enrollment.student)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium truncate">
                                    {getDisplayName(enrollment.student)}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{enrollment.student.email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Enrollment Details */}
                            <div className="flex items-center gap-6 text-sm shrink-0">
                              <div className="text-right min-w-[100px]">
                                <div className="text-muted-foreground mb-1">Progress</div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="font-semibold text-sm">
                                      {enrollment.progress?.completionPercentage || 0}%
                                    </span>
                                    {enrollment.progress?.status === "completed" && (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${enrollment.progress?.completionPercentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-muted-foreground mb-1">Enrolled</div>
                                <div className="flex items-center gap-1 justify-end">
                                  <Calendar className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs">{formatDate(enrollment.createdAt)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-muted-foreground mb-1">Amount</div>
                                <div className="font-semibold text-sm">
                                  {enrollment.payment 
                                    ? formatCurrency(enrollment.payment.amount)
                                    : "Free"}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Student
                                  </DropdownMenuItem>
                                  {enrollment.payment && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        View Payment
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && sortedCourses.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

