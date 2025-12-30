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
import { Textarea } from "@/components/ui/textarea"
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
  Package, 
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  DollarSign,
  BookOpen,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Pagination } from "@/components/ui/pagination"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"

interface Bundle {
  id: string;
  name: string;
  description?: string;
  courses: any[];
  courseIds?: string[];
  price: number;
  discount?: number;
  isActive: boolean;
  sales?: number;
  revenue?: number;
  createdAt: string;
}

export function AdminBundles() {
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseIds: [] as string[],
    price: 0,
    discount: 0,
    isActive: true,
  })

  // Refresh when navigating to this page
  useRefreshOnNavigation(() => {
    fetchBundles()
  })

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchBundles()
  }, [searchQuery])

  useEffect(() => {
    fetchBundles()
  }, [pagination.page])

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery
      }

      const response = await AdminAPI.getAllBundles(params)
      setBundles(response.bundles || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      }))
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch bundles')
      setBundles([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedBundle(null)
    setIsEditing(false)
    setFormData({
      name: '',
      description: '',
      courseIds: [],
      price: 0,
      discount: 0,
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (bundle: Bundle) => {
    setSelectedBundle(bundle)
    setIsEditing(true)
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      courseIds: bundle.courseIds || bundle.courses?.map((c: any) => c.id) || [],
      price: bundle.price,
      discount: bundle.discount || 0,
      isActive: bundle.isActive !== false,
    })
    setDialogOpen(true)
  }

  const handleDelete = (bundle: Bundle) => {
    setSelectedBundle(bundle)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || formData.courseIds.length === 0 || formData.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      if (isEditing && selectedBundle) {
        await AdminAPI.updateBundle(selectedBundle.id, formData)
        toast.success('Bundle updated successfully')
      } else {
        await AdminAPI.createBundle(formData)
        toast.success('Bundle created successfully')
      }
      setDialogOpen(false)
      fetchBundles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bundle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBundle) return

    try {
      await AdminAPI.deleteBundle(selectedBundle.id)
      toast.success('Bundle deleted successfully')
      setDeleteDialogOpen(false)
      fetchBundles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bundle')
    }
  }

  const filteredBundles = bundles.filter(bundle => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return bundle.name.toLowerCase().includes(query)
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
                <BreadcrumbPage>Bundles Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Bundles Management</h1>
              <p className="text-muted-foreground mt-1">
                View and manage course bundles
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Bundles</CardTitle>
                  <CardDescription>
                    Manage course bundles and pricing
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bundles..."
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
              ) : filteredBundles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No bundles found</p>
                  <p>Create your first bundle to get started.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBundles.map((bundle) => (
                        <TableRow key={bundle.id}>
                          <TableCell className="font-medium">{bundle.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {bundle.courses?.length || bundle.courseIds?.length || 0} courses
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {bundle.price.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {bundle.discount ? `${bundle.discount}%` : 'N/A'}
                          </TableCell>
                          <TableCell>{bundle.sales || 0}</TableCell>
                          <TableCell>
                            ${(bundle.revenue || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {bundle.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(bundle)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(bundle)}
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
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Bundle' : 'Create Bundle'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update bundle details' : 'Create a new course bundle'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bundle Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Complete Web Development Bundle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bundle description..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseIds">Course IDs (comma-separated) *</Label>
                <Input
                  id="courseIds"
                  value={formData.courseIds.join(', ')}
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id)
                    setFormData({ ...formData, courseIds: ids })
                  }}
                  placeholder="course-id-1, course-id-2, course-id-3"
                />
                <p className="text-xs text-muted-foreground">
                  Enter course IDs separated by commas
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="99.99"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedBundle?.name}"? This action cannot be undone.
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
