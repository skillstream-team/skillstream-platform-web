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
  HelpCircle, 
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  BookOpen,
  User,
  CheckCircle2
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/ui/pagination"

interface QA {
  id: string;
  question: string;
  student: {
    id: string;
    name: string;
  };
  courseId: string;
  courseName?: string;
  lessonId?: string;
  answers?: number;
  isResolved: boolean;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
}

export function AdminQA() {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QA[]>([])
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
  const [selectedQA, setSelectedQA] = useState<QA | null>(null)
  const [qaDetails, setQaDetails] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    status: 'ACTIVE' as 'ACTIVE' | 'HIDDEN' | 'DELETED',
    moderationReason: '',
  })

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchQuestions()
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchQuestions()
    }
  }, [searchQuery, statusFilter])

  useEffect(() => {
    if (hasFetched.current) {
      fetchQuestions()
    }
  }, [pagination.page])

  const fetchQuestions = async () => {
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

      const response = await AdminAPI.getAllQA(params)
      setQuestions(response.questions || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      }))
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch Q&A')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (qa: QA) => {
    try {
      const details = await AdminAPI.getQA(qa.id)
      setQaDetails(details.data)
      setSelectedQA(qa)
      setViewDialogOpen(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load Q&A details')
    }
  }

  const handleModerate = (qa: QA) => {
    setSelectedQA(qa)
    setFormData({
      status: qa.status,
      moderationReason: '',
    })
    setModerationDialogOpen(true)
  }

  const handleDelete = (qa: QA) => {
    setSelectedQA(qa)
    setDeleteDialogOpen(true)
  }

  const handleModerateSubmit = async () => {
    if (!selectedQA) return

    try {
      setIsSubmitting(true)
      await AdminAPI.moderateQA(selectedQA.id, {
        status: formData.status,
        moderationReason: formData.moderationReason || undefined,
      })
      toast.success('Q&A moderated successfully')
      setModerationDialogOpen(false)
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to moderate Q&A')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedQA) return

    try {
      await AdminAPI.deleteQA(selectedQA.id)
      toast.success('Q&A deleted successfully')
      setDeleteDialogOpen(false)
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete Q&A')
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
                <BreadcrumbPage>Q&A Moderation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Q&A Moderation</h1>
            <p className="text-muted-foreground mt-1">
              Moderate Q&A questions and answers across all courses
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Q&A Questions</CardTitle>
                  <CardDescription>
                    Moderate student questions and instructor answers
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
                      placeholder="Search questions..."
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
              ) : questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Q&A questions found</p>
                  <p>Questions will appear here once created by students.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Answers</TableHead>
                        <TableHead>Resolved</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((qa) => (
                        <TableRow key={qa.id}>
                          <TableCell className="font-medium max-w-md truncate">
                            {qa.question}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{qa.student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{qa.courseName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{qa.answers || 0}</TableCell>
                          <TableCell>
                            {qa.isResolved ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(qa.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(qa)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleModerate(qa)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(qa)}
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
              <DialogTitle>Q&A Details</DialogTitle>
              <DialogDescription>
                Question and answer details
              </DialogDescription>
            </DialogHeader>
            {qaDetails && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">Question</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {qaDetails.question}
                  </p>
                </div>
                {qaDetails.answers && qaDetails.answers.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Answers</Label>
                    <div className="space-y-2 mt-2">
                      {qaDetails.answers.map((answer: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{answer.content || answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              <DialogTitle>Moderate Q&A</DialogTitle>
              <DialogDescription>
                Update Q&A status and moderation settings
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
              <AlertDialogTitle>Delete Q&A</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this Q&A? This action cannot be undone.
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
