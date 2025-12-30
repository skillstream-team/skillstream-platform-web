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
  Users, 
  Search, 
  MoreVertical,
  Mail,
  Calendar,
  BookOpen,
  MessageSquare,
  Eye,
  Filter,
  ChevronDown,
  UserPlus,
  TrendingUp,
  Clock
} from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { StudentsAPI, StudentStats } from "@/api/students.api"
import { User, Pagination as PaginationType } from "@/api/types"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Pagination } from "@/components/ui/pagination"

interface Student {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  enrolledCourses: number
  totalSpent: number
  lastActive: string
  joinedDate: string
  avatar?: string
}

export function Students() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    avgCoursesPerStudent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    fetchStudentsData()
  }, [pagination.page])

  const fetchStudentsData = async () => {
    try {
      setLoading(true)
      const [studentsResponse, statsResponse] = await Promise.all([
        StudentsAPI.getStudents({ 
          page: pagination.page, 
          limit: pagination.limit,
          search: searchQuery || undefined,
        }),
        StudentsAPI.getStudentStats(),
      ])

      // Transform User data to Student data
      const transformedStudents: Student[] = studentsResponse.students.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enrolledCourses: 0, // Will be calculated if available
        totalSpent: 0, // Will be calculated if available
        lastActive: user.updatedAt || user.createdAt || new Date().toISOString(),
        joinedDate: user.createdAt || new Date().toISOString(),
        avatar: undefined,
      }))

      setStudents(transformedStudents)
      setStats(statsResponse)
      setPagination(studentsResponse.pagination)
    } catch (error: any) {
      console.error("Failed to fetch students:", error)
      // Handle 401 errors gracefully (expected in development mode)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      } else {
        // Only show error toast for non-auth errors
        toast.error(error?.response?.data?.message || "Failed to load students. Please try again.")
      }
      setStudents([])
      setStats({
        totalStudents: 0,
        totalEnrollments: 0,
        totalRevenue: 0,
        avgCoursesPerStudent: 0,
      })
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

  useEffect(() => {
    // Reset to page 1 when search changes
    if (pagination.page === 1) {
      fetchStudentsData()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Calculate statistics from fetched data
  const totalStudents = stats.totalStudents || students.length
  const totalEnrollments = stats.totalEnrollments || students.reduce((sum, student) => sum + student.enrolledCourses, 0)
  const totalRevenue = stats.totalRevenue || students.reduce((sum, student) => sum + student.totalSpent, 0)
  const avgCoursesPerStudent = stats.avgCoursesPerStudent > 0 
    ? stats.avgCoursesPerStudent.toFixed(1) 
    : (totalEnrollments / (totalStudents || 1)).toFixed(1)

  // Filter and sort students (search is handled by API, but filterBy and sortBy are local)
  const filteredStudents = students
    .filter((student) => {
      if (filterBy === "active") {
        const daysSinceActive = Math.floor(
          (Date.now() - new Date(student.lastActive).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceActive <= 7
      }
      if (filterBy === "new") {
        const daysSinceJoined = Math.floor(
          (Date.now() - new Date(student.joinedDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceJoined <= 30
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
        case "name":
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.username
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.username
          return nameA.localeCompare(nameB)
        case "courses":
          return b.enrolledCourses - a.enrolledCourses
        case "spent":
          return b.totalSpent - a.totalSpent
        default:
          return 0
      }
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
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getInitials = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
    }
    return student.username.substring(0, 2).toUpperCase()
  }

  const getDisplayName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`
    }
    return student.username
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
                <BreadcrumbPage>Students</BreadcrumbPage>
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
                  <CardTitle className="text-2xl">My Students</CardTitle>
                  <CardDescription>
                    Manage and view all students enrolled in your courses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-indigo-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Total Students
                  </div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BookOpen className="h-4 w-4 text-amber-600" />
                    Total Enrollments
                  </div>
                  <p className="text-2xl font-bold">{totalEnrollments}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Total Revenue
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                    Avg. Courses/Student
                  </div>
                  <p className="text-2xl font-bold">{avgCoursesPerStudent}</p>
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
                  placeholder="Search students..."
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
                    All Students
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("active")}>
                    Active (Last 7 days)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("new")}>
                    New (Last 30 days)
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
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("courses")}>
                    Most Courses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("spent")}>
                    Highest Spent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No students found</p>
                <p className="text-sm text-muted-foreground text-center">
                  {searchQuery
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating courses and students will appear here when they enroll."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Header with Avatar and Name */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.avatar} alt={getDisplayName(student)} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(student)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {getDisplayName(student)}
                              </h3>
                              {filterBy === "active" && (
                                <Badge variant="default" className="text-xs shrink-0">
                                  Active
                                </Badge>
                              )}
                              {filterBy === "new" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  New
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Enrollments
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Email Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Stats */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <BookOpen className="h-4 w-4 text-amber-600" />
                          <span>Enrolled Courses</span>
                        </div>
                        <p className="text-lg font-semibold">{student.enrolledCourses}</p>
                      </div>

                      {/* Dates */}
                      <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>Joined {formatDate(student.joinedDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-indigo-600" />
                            <span>Active {formatDate(student.lastActive)}</span>
                          </div>
                      </div>

                      {/* Message Button */}
                      <div className="pt-3 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            // Navigate to messages and create conversation with this student
                            navigate('/messages')
                            toast.info(`Opening conversation with ${getDisplayName(student)}`)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredStudents.length > 0 && pagination.totalPages > 1 && (
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

