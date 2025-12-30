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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Image, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface Banner {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  position: 'TOP' | 'SIDEBAR' | 'BOTTOM';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  targetAudience?: 'ALL' | 'STUDENTS' | 'TEACHERS';
  clicks?: number;
  impressions?: number;
  createdAt: string;
}

export function AdminBanners() {
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<Banner[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'TOP' as 'TOP' | 'SIDEBAR' | 'BOTTOM',
    isActive: true,
    startDate: '',
    endDate: '',
    targetAudience: 'ALL' as 'ALL' | 'STUDENTS' | 'TEACHERS',
    description: '',
    priority: 0,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getAllBanners()
      setBanners(response.banners || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch banners')
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedBanner(null)
    setIsEditing(false)
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      position: 'TOP',
      isActive: true,
      startDate: '',
      endDate: '',
      targetAudience: 'ALL',
      description: '',
      priority: 0,
    })
    setDialogOpen(true)
  }

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner)
    setIsEditing(true)
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      position: banner.position,
      isActive: banner.isActive,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      targetAudience: banner.targetAudience || 'ALL',
      description: '',
      priority: 0,
    })
    setDialogOpen(true)
  }

  const handleDelete = (banner: Banner) => {
    setSelectedBanner(banner)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: any = {
        title: formData.title,
        imageUrl: formData.imageUrl || undefined,
        linkUrl: formData.linkUrl || undefined,
        position: formData.position,
        isActive: formData.isActive,
        targetAudience: formData.targetAudience,
        description: formData.description || undefined,
        priority: formData.priority || undefined,
      }

      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString()
      }
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString()
      }

      if (isEditing && selectedBanner) {
        await AdminAPI.updateBanner(selectedBanner.id, payload)
        toast.success('Banner updated successfully')
      } else {
        await AdminAPI.createBanner(payload)
        toast.success('Banner created successfully')
      }
      setDialogOpen(false)
      fetchBanners()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save banner')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBanner) return

    try {
      await AdminAPI.deleteBanner(selectedBanner.id)
      toast.success('Banner deleted successfully')
      setDeleteDialogOpen(false)
      fetchBanners()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete banner')
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
                <BreadcrumbPage>Banner Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Banner Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage homepage banners and promotional content
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Banner
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Banners & Promotions</CardTitle>
              <CardDescription>
                Manage homepage banners and promotional content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No banners found</p>
                  <p>Create your first banner to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Target Audience</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell className="font-medium">{banner.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{banner.position}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{banner.targetAudience || 'ALL'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {banner.startDate && banner.endDate ? (
                              <span>
                                {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>No date range</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              {banner.impressions || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                              {banner.clicks || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {banner.isActive ? (
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
                              onClick={() => handleEdit(banner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(banner)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Banner' : 'Create Banner'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update banner details' : 'Create a new promotional banner'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Banner title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: 'TOP' | 'SIDEBAR' | 'BOTTOM') =>
                      setFormData({ ...formData, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOP">Top</SelectItem>
                      <SelectItem value="SIDEBAR">Sidebar</SelectItem>
                      <SelectItem value="BOTTOM">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value: 'ALL' | 'STUDENTS' | 'TEACHERS') =>
                      setFormData({ ...formData, targetAudience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="STUDENTS">Students</SelectItem>
                      <SelectItem value="TEACHERS">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Banner description..."
                  rows={3}
                />
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
              <AlertDialogTitle>Delete Banner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedBanner?.title}"? This action cannot be undone.
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
