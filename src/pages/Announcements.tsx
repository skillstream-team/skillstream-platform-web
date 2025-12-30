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
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
import { 
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Pin,
  Calendar,
  Save,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { AnnouncementsAPI, Announcement, AnnouncementPayload } from "@/api/announcements.api"
import { CoursesAPI } from "@/api/courses.api"
import { toast } from "sonner"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"

export function Announcements() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [formData, setFormData] = useState<AnnouncementPayload>({
    courseId: courseId || '',
    title: '',
    content: '',
    isPinned: false,
  })
  // Use refresh hook to refresh when navigating back
  useRefreshOnNavigation(() => {
    if (courseId) {
      fetchData()
    }
  })

  useEffect(() => {
    if (!courseId) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchData = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const [courseData, announcementsData] = await Promise.all([
        CoursesAPI.getCourse(courseId),
        AnnouncementsAPI.getAnnouncements(courseId, {
          page: pagination.page,
          limit: pagination.limit,
        })
      ])
      setCourse(courseData)
      setAnnouncements(announcementsData.announcements || [])
      setPagination(announcementsData.pagination)
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setAnnouncements([])
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

  const handleCreate = async () => {
    if (!formData.title || !formData.content || !courseId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setCreating(true)
      await AnnouncementsAPI.createAnnouncement({
        ...formData,
        courseId
      })
      setFormData({ courseId, title: '', content: '', isPinned: false })
      setCreating(false)
      toast.success('Announcement created successfully')
      // Reset to page 1 to see the new announcement
      if (pagination.page === 1) {
        fetchData()
      } else {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    } catch (error: any) {
      console.error('Failed to create announcement:', error)
      toast.error('Failed to create announcement. Please try again.')
      setCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      setCreating(true)
      await AnnouncementsAPI.updateAnnouncement(id, formData)
      setEditingId(null)
      setFormData({ courseId: courseId || '', title: '', content: '', isPinned: false })
      setCreating(false)
      toast.success('Announcement updated successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to update announcement:', error)
      toast.error('Failed to update announcement. Please try again.')
      setCreating(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setAnnouncementToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!announcementToDelete) return

    try {
      await AnnouncementsAPI.deleteAnnouncement(announcementToDelete)
      toast.success('Announcement deleted successfully')
      setDeleteDialogOpen(false)
      setAnnouncementToDelete(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete announcement:', error)
      toast.error('Failed to delete announcement. Please try again.')
    }
  }

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      courseId: announcement.courseId,
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ courseId: courseId || '', title: '', content: '', isPinned: false })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

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
                  <Link to="/courses">Courses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Announcements</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {course?.title || 'Course'} Announcements
              </h1>
              <p className="text-muted-foreground">
                Create and manage course announcements
              </p>
            </div>
          </div>

          {/* Create/Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
              </CardTitle>
              <CardDescription>
                Share important updates with your students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium leading-none">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Important course update"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium leading-none">
                  Content <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement here..."
                  className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isPinned" className="text-sm font-medium flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Pin to top
                </label>
              </div>
              <div className="flex justify-end gap-2">
                {editingId && (
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  disabled={creating || !formData.title || !formData.content}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {creating ? 'Saving...' : editingId ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcements List */}
          <Card>
            <CardHeader>
              <CardTitle>All Announcements</CardTitle>
              <CardDescription>
                {sortedAnnouncements.length} announcement{sortedAnnouncements.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : sortedAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {sortedAnnouncements.map((announcement) => (
                    <Card
                      key={announcement.id}
                      className={announcement.isPinned ? 'border-yellow-200 bg-yellow-50/30' : ''}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              {announcement.isPinned && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Pin className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(announcement.createdAt)}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(announcement)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(announcement.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No announcements yet</p>
                  <p className="text-sm mt-2">Create your first announcement to share updates with students</p>
                </div>
              )}

              {/* Pagination */}
              {!loading && sortedAnnouncements.length > 0 && pagination.totalPages > 1 && (
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

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this announcement? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

