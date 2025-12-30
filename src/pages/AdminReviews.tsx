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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare
} from "lucide-react"
import { useEffect, useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { ReviewsAPI, Review } from "@/api/reviews.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isModerateDialogOpen, setIsModerateDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'hide' | 'delete'>('approve')
  const [moderationReason, setModerationReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [pagination.page, ratingFilter, statusFilter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      // Try admin API first, fallback to ReviewsAPI if not available
      try {
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
        }
        if (ratingFilter !== "all") {
          params.rating = parseInt(ratingFilter)
        }
        if (statusFilter !== "all") {
          params.status = statusFilter
        }
        const response = await AdminAPI.getAllReviews(params)
        let filteredReviews = response.reviews || []
        if (searchQuery) {
          filteredReviews = filteredReviews.filter((review: Review) =>
            review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        setReviews(filteredReviews)
        setPagination(response.pagination || pagination)
      } catch (error: any) {
        // Fallback to regular ReviewsAPI
        if (error?.response?.status === 404) {
          const response = await ReviewsAPI.getReviews({ page: pagination.page, limit: pagination.limit })
          let filteredReviews = response.reviews || []
          if (searchQuery) {
            filteredReviews = filteredReviews.filter((review: Review) =>
              review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          }
          if (ratingFilter !== "all") {
            filteredReviews = filteredReviews.filter((review: Review) => review.rating === parseInt(ratingFilter))
          }
          setReviews(filteredReviews)
          if (response.pagination) {
            setPagination(response.pagination)
          }
        } else {
          throw error
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error)
      toast.error("Failed to load reviews")
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = (review: Review, action: 'approve' | 'reject' | 'hide' | 'delete') => {
    setSelectedReview(review)
    setModerationAction(action)
    setModerationReason("")
    setIsModerateDialogOpen(true)
  }

  const confirmModeration = async () => {
    if (!selectedReview) return
    setIsProcessing(true)
    try {
      await AdminAPI.moderateReview(selectedReview.id, moderationAction, moderationReason)
      toast.success(`Review ${moderationAction}d successfully`)
      setIsModerateDialogOpen(false)
      setSelectedReview(null)
      setModerationReason("")
      fetchReviews()
    } catch (error: any) {
      console.error("Failed to moderate review:", error)
      if (error?.response?.status === 404) {
        toast.info("Review moderation API not yet implemented on backend")
      } else {
        toast.error(error?.response?.data?.message || "Failed to moderate review")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}</span>
      </div>
    )
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
                <BreadcrumbPage>Review Moderation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Review Moderation</h1>
            <p className="text-muted-foreground mt-1">
              Moderate and manage course reviews
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by comment or user email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="pl-8"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>
                All course reviews in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reviews found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={review.user?.avatar} />
                                <AvatarFallback>
                                  {review.user?.firstName?.[0] || review.user?.email?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {review.user?.firstName && review.user?.lastName
                                    ? `${review.user.firstName} ${review.user.lastName}`
                                    : review.user?.email || "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {review.user?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {review.course?.title || "Unknown Course"}
                            </div>
                          </TableCell>
                          <TableCell>{renderStars(review.rating)}</TableCell>
                          <TableCell>
                            <div className="max-w-md truncate">
                              {review.comment || (
                                <span className="text-muted-foreground italic">No comment</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleModerate(review, 'approve')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleModerate(review, 'reject')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleModerate(review, 'hide')}>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Hide
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleModerate(review, 'delete')}
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

          {/* Moderation Dialog */}
          <AlertDialog open={isModerateDialogOpen} onOpenChange={setIsModerateDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {moderationAction === 'approve' && 'Approve Review'}
                  {moderationAction === 'reject' && 'Reject Review'}
                  {moderationAction === 'hide' && 'Hide Review'}
                  {moderationAction === 'delete' && 'Delete Review'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {moderationAction} this review?
                  {(moderationAction === 'reject' || moderationAction === 'delete') && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="reason">Reason (Optional)</Label>
                      <Textarea
                        id="reason"
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                        placeholder="Enter reason for rejection/deletion..."
                        rows={3}
                      />
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmModeration}
                  disabled={isProcessing}
                  className={
                    moderationAction === 'delete'
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : ""
                  }
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

