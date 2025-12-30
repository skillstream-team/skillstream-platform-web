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
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Tags,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Loader2
} from "lucide-react"
import { useEffect, useState } from "react"
import { TagsAPI, Tag } from "@/api/tags.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"

export function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagName, setTagName] = useState("")

  // Refresh when navigating to this page
  useRefreshOnNavigation(() => {
    fetchTags()
  })

  useEffect(() => {
    fetchTags()
  }, [pagination.page, searchQuery])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await TagsAPI.getTags(params)
      let filteredTags = response.tags || []
      
      // Client-side filtering if backend doesn't support search
      if (searchQuery && !params.search) {
        filteredTags = filteredTags.filter(tag =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setTags(filteredTags)
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error: any) {
      console.error("Failed to fetch tags:", error)
      toast.error("Failed to load tags")
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTag(null)
    setTagName("")
    setIsDialogOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setIsDialogOpen(true)
  }

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingTag) {
        await TagsAPI.updateTag(editingTag.id, tagName)
        toast.success("Tag updated successfully")
      } else {
        await TagsAPI.createTag(tagName)
        toast.success("Tag created successfully")
      }
      setIsDialogOpen(false)
      setTagName("")
      setEditingTag(null)
      fetchTags()
    } catch (error: any) {
      console.error("Failed to save tag:", error)
      toast.error(error?.response?.data?.message || "Failed to save tag")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingTag) return
    setIsSubmitting(true)
    try {
      await TagsAPI.deleteTag(deletingTag.id)
      toast.success("Tag deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingTag(null)
      fetchTags()
    } catch (error: any) {
      console.error("Failed to delete tag:", error)
      toast.error(error?.response?.data?.message || "Failed to delete tag")
    } finally {
      setIsSubmitting(false)
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
                <BreadcrumbPage>Tag Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tag Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage tags for organizing and categorizing courses
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="pl-8"
              />
            </div>
          </div>

          {/* Tags Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                All tags in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tags className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tags found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tag
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">
                            {tag.name}
                          </TableCell>
                          <TableCell>
                            {new Date(tag.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(tag)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(tag)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) =>
                          setPagination(prev => ({ ...prev, page }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? "Edit Tag" : "Create Tag"}
                </DialogTitle>
                <DialogDescription>
                  {editingTag
                    ? "Update tag name"
                    : "Add a new tag for organizing courses"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagName">Tag Name *</Label>
                    <Input
                      id="tagName"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      placeholder="e.g., beginner, advanced, javascript"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingTag ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deletingTag?.name}"?
                  This action cannot be undone. Courses using this tag may be
                  affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
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

