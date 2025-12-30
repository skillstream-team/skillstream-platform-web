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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Loader2,
  Download,
  Eye
} from "lucide-react"
import { useEffect, useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"

interface Payout {
  id: string
  teacherId: string
  teacher?: {
    firstName?: string
    lastName?: string
    email: string
  }
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
}

export function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
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
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPayouts()
  }, [pagination.page, statusFilter])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      const response = await AdminAPI.getPayouts(params)
      
      let filteredPayouts = response.payouts || []
      if (searchQuery) {
        filteredPayouts = filteredPayouts.filter((p: Payout) =>
          p.teacher?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.teacher?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.teacher?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setPayouts(filteredPayouts)
      setPagination(response.pagination || pagination)
    } catch (error: any) {
      console.error("Failed to fetch payouts:", error)
      toast.error("Failed to load payouts")
      setPayouts([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (payout: Payout) => {
    setSelectedPayout(payout)
    setIsApproveDialogOpen(true)
  }

  const handleReject = (payout: Payout) => {
    setSelectedPayout(payout)
    setRejectionReason("")
    setIsRejectDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await AdminAPI.approvePayout(selectedPayout.id)
      toast.success("Payout approved successfully")
      setIsApproveDialogOpen(false)
      setSelectedPayout(null)
      fetchPayouts()
    } catch (error: any) {
      console.error("Failed to approve payout:", error)
      toast.error(error?.response?.data?.message || "Failed to approve payout")
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await AdminAPI.rejectPayout(selectedPayout.id, rejectionReason)
      toast.success("Payout rejected")
      setIsRejectDialogOpen(false)
      setSelectedPayout(null)
      setRejectionReason("")
      fetchPayouts()
    } catch (error: any) {
      console.error("Failed to reject payout:", error)
      toast.error(error?.response?.data?.message || "Failed to reject payout")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
                <BreadcrumbPage>Payout Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Payout Management</h1>
              <p className="text-muted-foreground mt-1">
                Review and process teacher payout requests
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by teacher email or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="pl-8"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                  Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>
                Review and manage teacher payout requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : payouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payout requests found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payout.teacher?.firstName && payout.teacher?.lastName
                                  ? `${payout.teacher.firstName} ${payout.teacher.lastName}`
                                  : "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payout.teacher?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payout.amount, payout.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell>
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payout.processedAt
                              ? new Date(payout.processedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {payout.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(payout)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(payout)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {payout.status === "rejected" && payout.rejectionReason && (
                              <div className="text-sm text-muted-foreground">
                                Reason: {payout.rejectionReason}
                              </div>
                            )}
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

          {/* Approve Dialog */}
          <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Payout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this payout request of{" "}
                  {selectedPayout && formatCurrency(selectedPayout.amount, selectedPayout.currency)}
                  ? The payment will be processed to the teacher.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmApprove}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reject Dialog */}
          <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Payout</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for rejecting this payout request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

