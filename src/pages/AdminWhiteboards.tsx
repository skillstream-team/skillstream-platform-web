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
  PenTool, 
  Search,
  Trash2,
  BookOpen,
  User,
  Calendar,
  HardDrive
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"

interface Whiteboard {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
  };
  courseId?: string;
  lessonId?: string;
  size?: number;
  createdAt: string;
  lastAccessed?: string;
}

export function AdminWhiteboards() {
  const [loading, setLoading] = useState(true)
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWhiteboard, setSelectedWhiteboard] = useState<Whiteboard | null>(null)

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchWhiteboards()
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchWhiteboards()
    }
  }, [searchQuery])

  useEffect(() => {
    if (hasFetched.current) {
      fetchWhiteboards()
    }
  }, [pagination.page])

  const fetchWhiteboards = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery
      }

      const response = await AdminAPI.getAllWhiteboards(params)
      setWhiteboards(response.whiteboards || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      }))
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch whiteboards')
      setWhiteboards([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (whiteboard: Whiteboard) => {
    setSelectedWhiteboard(whiteboard)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedWhiteboard) return

    try {
      await AdminAPI.deleteWhiteboard(selectedWhiteboard.id)
      toast.success('Whiteboard deleted successfully')
      setDeleteDialogOpen(false)
      fetchWhiteboards()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete whiteboard')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const filteredWhiteboards = whiteboards.filter(wb => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      wb.name.toLowerCase().includes(query) ||
      wb.owner.name.toLowerCase().includes(query)
    )
  })

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
                <BreadcrumbPage>Whiteboards Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Whiteboards Management</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all whiteboards in the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Whiteboards</CardTitle>
                  <CardDescription>
                    View and manage whiteboards across all courses
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search whiteboards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
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
              ) : filteredWhiteboards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PenTool className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No whiteboards found</p>
                  <p>Whiteboards will appear here once created by users.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Accessed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWhiteboards.map((wb) => (
                        <TableRow key={wb.id}>
                          <TableCell className="font-medium">{wb.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{wb.owner.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {wb.courseId ? (
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Course</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              {formatFileSize(wb.size)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(wb.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {wb.lastAccessed ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(wb.lastAccessed).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(wb)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Whiteboard</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedWhiteboard?.name}"? This action cannot be undone.
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
