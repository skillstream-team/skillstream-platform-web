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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogTrigger,
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
  FolderTree,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Loader2
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { CategoriesAPI } from "@/api/categories.api"
import { toast } from "sonner"
import { useErrorDisplay } from "@/hooks/useErrorDisplay"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"

export function AdminCategories() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useErrorDisplay()
  const [categories, setCategories] = useState<any[]>([])
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
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })
  const [parentCategories, setParentCategories] = useState<any[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch categories when page changes (but not when searchQuery changes - that's handled separately)
  useEffect(() => {
    if (!searchQuery) {
      // Only fetch if there's no active search (search has its own debounced effect)
      fetchCategories()
    }
  }, [pagination.page])

  // Debounce search to avoid fetching on every keystroke
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // If search is cleared, fetch immediately
    if (!searchQuery.trim()) {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchCategories(1)
      return
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      // Reset to page 1 when search changes
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchCategories(1)
    }, 300) // Wait 300ms after user stops typing

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  useEffect(() => {
    if (isDialogOpen && !editingCategory) {
      fetchParentCategories()
    }
  }, [isDialogOpen, editingCategory])

  // Refresh when navigating to this page
  useRefreshOnNavigation(() => {
    fetchCategories()
  })

  const fetchCategories = async (pageOverride?: number) => {
    try {
      setLoading(true)
      // For search, we need to fetch all categories and filter client-side
      // Otherwise, use pagination
      const pageToUse = pageOverride !== undefined ? pageOverride : pagination.page
      const params: any = {
        page: searchQuery ? 1 : pageToUse, // Always page 1 when searching
        limit: searchQuery ? 1000 : pagination.limit, // Fetch more when searching to filter client-side
      }
      
      const response = await CategoriesAPI.getCategories(params)
      console.log('Categories API response:', response)
      
      // Handle different response structures
      let categoriesList: any[] = []
      if (Array.isArray(response)) {
        // If response is directly an array
        categoriesList = response
      } else if (response?.categories && Array.isArray(response.categories)) {
        // If response has categories property
        categoriesList = response.categories
      } else if (response?.data && Array.isArray(response.data)) {
        // If response is wrapped in data property
        categoriesList = response.data
      }
      
      console.log('Parsed categories:', categoriesList)
      
      // Apply client-side search filtering
      let filteredCategories = categoriesList
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filteredCategories = categoriesList.filter(cat =>
          cat.name.toLowerCase().includes(query) ||
          (cat.description && cat.description.toLowerCase().includes(query))
        )
      }
      
      // Apply pagination to filtered results
      const totalFiltered = filteredCategories.length
      const itemsPerPage = pagination.limit
      const currentPage = searchQuery ? 1 : pageToUse
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedCategories = searchQuery 
        ? filteredCategories.slice(startIndex, endIndex)
        : filteredCategories
      
      setCategories(paginatedCategories)
      
      // Update pagination based on filtered results
      if (searchQuery) {
        // When searching, paginate the filtered results
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / itemsPerPage),
          hasNext: endIndex < totalFiltered,
          hasPrev: currentPage > 1,
        }))
      } else {
        // When not searching, use backend pagination if available
        if (response?.pagination) {
          setPagination(response.pagination)
        } else {
          setPagination(prev => ({
            ...prev,
            total: categoriesList.length,
            totalPages: Math.ceil(categoriesList.length / itemsPerPage),
            hasNext: endIndex < categoriesList.length,
            hasPrev: currentPage > 1,
          }))
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch categories:", error)
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      })
      showError(error?.response?.data?.message || "Failed to load categories", "Error Loading Categories")
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchParentCategories = async () => {
    try {
      const response = await CategoriesAPI.getCategories({ limit: 100 })
      setParentCategories(response.categories || [])
    } catch (error) {
      console.error("Failed to fetch parent categories:", error)
    }
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", parentId: "" })
    setIsDialogOpen(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (category: any) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingCategory) {
        await CategoriesAPI.updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || undefined,
          parentId: formData.parentId || undefined,
        })
        toast.success("Category updated successfully")
        // Refresh categories to show updated data
        await fetchCategories()
      } else {
        await CategoriesAPI.createCategory({
          name: formData.name,
          description: formData.description || undefined,
          parentId: formData.parentId || undefined,
        })
        toast.success("Category created successfully")
        // Reset to page 1 after creating new category so it appears
        setPagination(prev => ({ ...prev, page: 1 }))
        // Fetch categories with page 1 to show the new category
        await fetchCategories(1)
      }
      setIsDialogOpen(false)
      setFormData({ name: "", description: "", parentId: "" })
      setEditingCategory(null)
    } catch (error: any) {
      console.error("Failed to save category:", error)
      showError(error?.response?.data?.message || "Failed to save category", "Error Saving Category")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    setIsSubmitting(true)
    try {
      await CategoriesAPI.deleteCategory(deletingCategory.id)
      showSuccess("Category deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
      fetchCategories()
    } catch (error: any) {
      console.error("Failed to delete category:", error)
      showError(error?.response?.data?.message || "Failed to delete category", "Error Deleting Category")
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
                <BreadcrumbPage>Category Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Category Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage course categories and organize content
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="pl-8"
              />
            </div>
          </div>

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                All course categories in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No categories found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Parent Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => {
                        const parentCategory = parentCategories.find(
                          p => p.id === category.parentId
                        )
                        return (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell>
                              {category.description || (
                                <span className="text-muted-foreground">
                                  No description
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {parentCategory ? (
                                parentCategory.name
                              ) : (
                                <span className="text-muted-foreground">
                                  None
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(category.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(category)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(category)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
                  {editingCategory ? "Edit Category" : "Create Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Update category details"
                    : "Add a new category to organize courses"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Programming, Design"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent Category (Optional)</Label>
                    <Select
                      value={formData.parentId || "none"}
                      onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          parentId: value === "none" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top-level category)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Top-level category)</SelectItem>
                        {parentCategories
                          .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deletingCategory?.name}"?
                  This action cannot be undone. Courses using this category may
                  be affected.
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

