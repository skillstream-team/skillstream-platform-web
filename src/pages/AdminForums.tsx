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
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MessageSquare, 
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Pin,
  Lock,
  Unlock,
  BookOpen,
  User
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/ui/pagination"

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  courseId: string;
  courseName?: string;
  replies?: number;
  views?: number;
  isPinned: boolean;
  isLocked: boolean;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
}

export function AdminForums() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [postDetails, setPostDetails] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    status: 'ACTIVE' as 'ACTIVE' | 'HIDDEN' | 'DELETED',
    isPinned: false,
    isLocked: false,
    moderationReason: '',
  })

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchPosts()
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchPosts()
    }
  }, [searchQuery, statusFilter])

  useEffect(() => {
    if (hasFetched.current) {
      fetchPosts()
    }
  }, [pagination.page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await AdminAPI.getAllForumPosts(params)
      setPosts(response.posts || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      }))
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch forum posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (post: ForumPost) => {
    try {
      const details = await AdminAPI.getForumPost(post.id)
      setPostDetails(details.data)
      setSelectedPost(post)
      setViewDialogOpen(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load post details')
    }
  }

  const handleModerate = (post: ForumPost) => {
    setSelectedPost(post)
    setFormData({
      status: post.status,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      moderationReason: '',
    })
    setModerationDialogOpen(true)
  }

  const handleDelete = (post: ForumPost) => {
    setSelectedPost(post)
    setDeleteDialogOpen(true)
  }

  const handleModerateSubmit = async () => {
    if (!selectedPost) return

    try {
      setIsSubmitting(true)
      await AdminAPI.moderateForumPost(selectedPost.id, {
        status: formData.status,
        isPinned: formData.isPinned,
        isLocked: formData.isLocked,
        moderationReason: formData.moderationReason || undefined,
      })
      toast.success('Forum post moderated successfully')
      setModerationDialogOpen(false)
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to moderate forum post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPost) return

    try {
      await AdminAPI.deleteForumPost(selectedPost.id)
      toast.success('Forum post deleted successfully')
      setDeleteDialogOpen(false)
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete forum post')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'HIDDEN':
        return <Badge variant="secondary">Hidden</Badge>
      case 'DELETED':
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/admin">Admin</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Forums Moderation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Forums Moderation</h1>
            <p className="text-muted-foreground mt-1">
              Moderate forum posts and discussions across all courses
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Forum Posts</CardTitle>
                  <CardDescription>
                    Moderate forum posts and discussions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="HIDDEN">Hidden</SelectItem>
                      <SelectItem value="DELETED">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No forum posts found</p>
                  <p>Forum posts will appear here once created by users.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Replies</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {post.title}
                              {post.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
                              {post.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{post.author.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{post.courseName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{post.replies || 0}</TableCell>
                          <TableCell>{post.views || 0}</TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {post.isPinned && <Badge variant="outline" className="text-xs">Pinned</Badge>}
                              {post.isLocked && <Badge variant="outline" className="text-xs">Locked</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(post)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleModerate(post)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(post)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {pagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost?.title}</DialogTitle>
              <DialogDescription>
                Forum post details
              </DialogDescription>
            </DialogHeader>
            {postDetails && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {postDetails.content}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Author</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {postDetails.author?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {postDetails.status}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Moderation Dialog */}
        <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Moderate Forum Post</DialogTitle>
              <DialogDescription>
                Update post status and moderation settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="HIDDEN">Hidden</SelectItem>
                    <SelectItem value="DELETED">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                />
                <Label htmlFor="isPinned">Pin Post</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isLocked"
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
                />
                <Label htmlFor="isLocked">Lock Post</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moderationReason">Moderation Reason (Optional)</Label>
                <Textarea
                  id="moderationReason"
                  value={formData.moderationReason}
                  onChange={(e) => setFormData({ ...formData, moderationReason: e.target.value })}
                  placeholder="Reason for moderation action..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModerationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleModerateSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Forum Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
