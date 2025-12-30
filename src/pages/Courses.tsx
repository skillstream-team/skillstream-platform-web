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
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  ArrowRight,
  DollarSign,
  Calendar,
  Eye,
  Copy,
  Loader2,
  Filter,
  ChevronDown
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"
import { toast } from "sonner"
import { CoursesAPI } from "@/api/courses.api"
import { Course, Pagination as PaginationType } from "@/api/types"
import { getCurrentUser } from "@/api/auth-utils"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
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


export function Courses() {
  const navigate = useNavigate()
  const { settings } = useSystemSettings()
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
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
    cacheKey: `courses-${pagination.page}-${searchQuery}-${difficultyFilter}-${sortBy}`,
    debounceMs: 500,
  })

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // Don't fetch here - let the hook handle it or fetch on page change
  }, [searchQuery, difficultyFilter, sortBy])

  useEffect(() => {
    if (!isFetching.current) {
      fetchCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchCourses = async () => {
    // Prevent duplicate calls
    if (isFetching.current) {
      return
    }
    
    try {
      isFetching.current = true
      setLoading(true)
      const currentUser = getCurrentUser()
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        instructorId: currentUser?.id,
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      if (difficultyFilter !== "all") {
        params.difficulty = difficultyFilter
      }
      
      // Map sortBy to API sortBy and sortOrder
      switch (sortBy) {
        case "newest":
          params.sortBy = "createdAt"
          params.sortOrder = "desc"
          break
        case "oldest":
          params.sortBy = "createdAt"
          params.sortOrder = "asc"
          break
        case "price-low":
          params.sortBy = "price"
          params.sortOrder = "asc"
          break
        case "price-high":
          params.sortBy = "price"
          params.sortOrder = "desc"
          break
        case "duration-low":
          params.sortBy = "duration"
          params.sortOrder = "asc"
          break
        case "duration-high":
          params.sortBy = "duration"
          params.sortOrder = "desc"
          break
      }

      const response = await CoursesAPI.getCourses(params)
      setCourses(response.courses || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
      // Only show error if not already loading (to avoid spam)
      if (!loading) {
        toast.error(error?.response?.data?.message || 'Failed to load courses. Please try again.')
      }
      setCourses([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }

  // API handles filtering and sorting, so we use courses directly
  const filteredCourses = courses

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    try {
      setDeletingId(courseToDelete)
      await CoursesAPI.deleteCourse(courseToDelete)
      toast.success('Course deleted successfully')
      setDeleteDialogOpen(false)
      setCourseToDelete(null)
      // Refresh list
      fetchCourses()
    } catch (error: any) {
      console.error('Failed to delete course:', error)
      toast.error(error?.response?.data?.message || 'Failed to delete course. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (courseId: string) => {
    try {
      const course = await CoursesAPI.getCourse(courseId)
      const duplicatedCourse = {
        ...course,
        title: `${course.title} (Copy)`,
      }
      delete (duplicatedCourse as any).id
      delete (duplicatedCourse as any).createdAt
      delete (duplicatedCourse as any).updatedAt
      
      const newCourse = await CoursesAPI.createCourse(duplicatedCourse as any)
      toast.success('Course duplicated successfully!')
      navigate(`/courses/${newCourse.id}/builder`, { state: { refreshCourses: true } })
    } catch (error: any) {
      console.error('Failed to duplicate course:', error)
      toast.error(error?.response?.data?.message || 'Failed to duplicate course. Please try again.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'default'
      case 'INTERMEDIATE':
        return 'secondary'
      case 'ADVANCED':
        return 'outline'
      case 'EXPERT':
        return 'destructive'
      default:
        return 'outline'
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
                <BreadcrumbPage>Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Header Section with Statistics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold tracking-tight">My Courses</CardTitle>
                  <CardDescription className="mt-1">
                    Manage and create your courses
                  </CardDescription>
                </div>
                {settings?.allowCourseCreation !== false && (
                  <Button onClick={() => navigate('/courses/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                )}
              </div>
            </CardHeader>
            {filteredCourses.length > 0 && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                      <p className="text-2xl font-bold">{filteredCourses.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(filteredCourses.reduce((sum, c) => sum + c.price, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Duration</p>
                      <p className="text-2xl font-bold">
                        {filteredCourses.reduce((sum, c) => sum + c.duration, 0)} min
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Search and Filters */}
          <div className="flex items-center justify-end gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Difficulty
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDifficultyFilter("all")}>
                  All Levels
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDifficultyFilter("BEGINNER")}>
                  Beginner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter("INTERMEDIATE")}>
                  Intermediate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter("ADVANCED")}>
                  Advanced
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter("EXPERT")}>
                  Expert
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
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                  Price: High to Low
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("duration-low")}>
                  Duration: Shortest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("duration-high")}>
                  Duration: Longest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-0">
                    <Skeleton className="w-full h-48" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No courses found' : 'No courses yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  {searchQuery 
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Get started by creating your first course and sharing your knowledge with students.'}
                </p>
                {!searchQuery && settings?.allowCourseCreation !== false && (
                  <Button onClick={() => navigate('/courses/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="p-0 relative">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/builder`)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Course Builder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/builder`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/builder`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(course.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(course.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingId === course.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 flex-1 pr-2">
                        {course.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                      {course.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Badge variant={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{course.duration} min</span>
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {formatCurrency(course.price)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/courses/${course.id}/builder`)}
                      >
                        View
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredCourses.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this course? This action cannot be undone and will permanently remove the course and all its content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

