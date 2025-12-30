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
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  BookOpen, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  AlertCircle
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import { AdminAPI, CourseModerationPayload } from "@/api/admin.api"
import { Course } from "@/api/types"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdminCourses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendingCourses, setPendingCourses] = useState<Course[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false)
  const [courseToModerate, setCourseToModerate] = useState<Course | null>(null)
  const [moderationAction, setModerationAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [rejectionReason, setRejectionReason] = useState('')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchPendingCourses()
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current && activeTab === 'pending') {
      fetchPendingCourses()
    }
  }, [pagination.page, activeTab])

  const fetchPendingCourses = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getPendingCourses({
        page: pagination.page,
        limit: pagination.limit,
      })
      setPendingCourses(response.courses || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      }))
    } catch (error: any) {
      console.error('Failed to fetch pending courses:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load pending courses')
      }
      setPendingCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleModerateCourse = async () => {
    if (!courseToModerate) return

    try {
      const payload: CourseModerationPayload = {
        status: moderationAction,
        rejectionReason: moderationAction === 'REJECTED' ? rejectionReason : undefined,
      }
      
      await AdminAPI.moderateCourse(courseToModerate.id, payload)
      toast.success(`Course ${moderationAction === 'APPROVED' ? 'approved' : 'rejected'} successfully`)
      setModerationDialogOpen(false)
      setCourseToModerate(null)
      setRejectionReason('')
      fetchPendingCourses()
    } catch (error: any) {
      console.error('Failed to moderate course:', error)
      toast.error(error?.response?.data?.message || 'Failed to moderate course')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/admin">Admin</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Course Moderation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Course Moderation</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve courses submitted by teachers
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
            <TabsList>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending Approval ({pagination.total})
              </TabsTrigger>
              <TabsTrigger value="all">
                <BookOpen className="h-4 w-4 mr-2" />
                All Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Courses</CardTitle>
                  <CardDescription>
                    Courses awaiting admin approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : pendingCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                      <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No courses pending approval
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {pendingCourses.map((course) => (
                          <Card key={course.id} className="border-l-4 border-l-yellow-500">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold">{course.title}</h3>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                      Pending
                                    </Badge>
                                  </div>
                                  {course.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                      {course.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4" />
                                      <span>Instructor ID: {course.instructorId}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Submitted: {formatDate(course.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="h-4 w-4" />
                                      <span>Duration: {course.duration} min</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>Price: {formatCurrency(course.price)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setCourseToModerate(course)
                                      setModerationAction('APPROVED')
                                      setModerationDialogOpen(true)
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setCourseToModerate(course)
                                      setModerationAction('REJECTED')
                                      setModerationDialogOpen(true)
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination */}
                      {pagination.totalPages > 1 && (
                        <div className="mt-4 flex justify-center">
                          <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Courses</CardTitle>
                  <CardDescription>
                    View and manage all courses in the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">All Courses View</h3>
                    <p className="text-muted-foreground mb-4">
                      Navigate to the Courses page to view all courses
                    </p>
                    <Button onClick={() => navigate('/courses')}>
                      View All Courses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Moderation Dialog */}
        <AlertDialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {moderationAction === 'APPROVED' ? 'Approve Course' : 'Reject Course'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {moderationAction === 'APPROVED' 
                  ? `Are you sure you want to approve "${courseToModerate?.title}"? This will make it available to students.`
                  : `Are you sure you want to reject "${courseToModerate?.title}"? Please provide a reason.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {moderationAction === 'REJECTED' && (
              <div className="space-y-2 py-4">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this course is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleModerateCourse}
                disabled={moderationAction === 'REJECTED' && !rejectionReason.trim()}
                className={moderationAction === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {moderationAction === 'APPROVED' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

