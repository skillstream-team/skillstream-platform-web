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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Ticket,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"
import { CouponsAPI, Coupon, CouponPayload } from "@/api/coupons.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CouponPayload>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchaseAmount: undefined,
    maxDiscountAmount: undefined,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: "",
    usageLimit: undefined,
    applicableCourseIds: undefined,
  })

  useEffect(() => {
    fetchCoupons()
  }, [pagination.page, statusFilter])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active"
      }
      const response = await CouponsAPI.getCoupons(params)
      
      let filteredCoupons = response.coupons || []
      if (searchQuery) {
        filteredCoupons = filteredCoupons.filter(coupon =>
          coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setCoupons(filteredCoupons)
      setPagination(response.pagination || pagination)
    } catch (error: any) {
      console.error("Failed to fetch coupons:", error)
      toast.error("Failed to load coupons")
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: "",
      usageLimit: undefined,
      applicableCourseIds: undefined,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit,
      applicableCourseIds: coupon.applicableCourseIds,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (coupon: Coupon) => {
    setDeletingCoupon(coupon)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: CouponPayload = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      }
      
      if (editingCoupon) {
        await CouponsAPI.updateCoupon(editingCoupon.id, payload)
        toast.success("Coupon updated successfully")
      } else {
        await CouponsAPI.createCoupon(payload)
        toast.success("Coupon created successfully")
      }
      setIsDialogOpen(false)
      setEditingCoupon(null)
      fetchCoupons()
    } catch (error: any) {
      console.error("Failed to save coupon:", error)
      toast.error(error?.response?.data?.message || "Failed to save coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return
    setIsSubmitting(true)
    try {
      await CouponsAPI.deleteCoupon(deletingCoupon.id)
      toast.success("Coupon deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingCoupon(null)
      fetchCoupons()
    } catch (error: any) {
      console.error("Failed to delete coupon:", error)
      toast.error(error?.response?.data?.message || "Failed to delete coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCouponActive = (coupon: Coupon) => {
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validUntil = new Date(coupon.validUntil)
    return coupon.isActive && now >= validFrom && now <= validUntil
  }

  const isCouponExpired = (coupon: Coupon) => {
    const now = new Date()
    const validUntil = new Date(coupon.validUntil)
    return now > validUntil
  }

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.usageLimit) return null
    return Math.round((coupon.usageCount / coupon.usageLimit) * 100)
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
                <BreadcrumbPage>Coupon Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Coupon Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage discount coupons for courses
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coupons Table */}
          <Card>
            <CardHeader>
              <CardTitle>Coupons</CardTitle>
              <CardDescription>
                All discount coupons in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No coupons found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Coupon
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Valid Period</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => {
                        const active = isCouponActive(coupon)
                        const expired = isCouponExpired(coupon)
                        const usagePct = getUsagePercentage(coupon)
                        
                        return (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-medium font-mono">
                              {coupon.code}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}%`
                                    : `$${coupon.discountValue}`}
                                </span>
                                {coupon.maxDiscountAmount && (
                                  <span className="text-xs text-muted-foreground">
                                    Max: ${coupon.maxDiscountAmount}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {active ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : expired ? (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Expired
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {coupon.usageCount} / {coupon.usageLimit || '∞'}
                                </span>
                                {usagePct !== null && (
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${Math.min(usagePct, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span>From: {new Date(coupon.validFrom).toLocaleDateString()}</span>
                                <span>To: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(coupon.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(coupon)}
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </DialogTitle>
                <DialogDescription>
                  {editingCoupon
                    ? "Update coupon details"
                    : "Create a new discount coupon"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="SAVE20"
                      required
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountType">Discount Type *</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value: 'percentage' | 'fixed') =>
                          setFormData(prev => ({ ...prev, discountType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Discount Value *</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        step={formData.discountType === 'percentage' ? "1" : "0.01"}
                        max={formData.discountType === 'percentage' ? "100" : undefined}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom">Valid From *</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, validFrom: e.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until *</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, validUntil: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPurchaseAmount">Min Purchase Amount (Optional)</Label>
                      <Input
                        id="minPurchaseAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minPurchaseAmount || ""}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountAmount">Max Discount Amount (Optional)</Label>
                      <Input
                        id="maxDiscountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxDiscountAmount || ""}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                          }))
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit || ""}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          usageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="Unlimited"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for unlimited uses
                    </p>
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
                    {editingCoupon ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete coupon "{deletingCoupon?.code}"?
                  This action cannot be undone.
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

