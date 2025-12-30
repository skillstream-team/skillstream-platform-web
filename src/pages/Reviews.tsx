import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  Star,
  Search,
  Filter,
  ChevronDown,
  BookOpen,
  TrendingUp,
  MessageSquare
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { ReviewsAPI } from "@/api/reviews.api"
import { Review, Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchReviews()
  }, [])

  useEffect(() => {
    if (!hasFetched.current) return
    // Reset to page 1 when filters change
    if (pagination.page === 1) {
      fetchReviews()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter, courseFilter])

  useEffect(() => {
    if (!hasFetched.current) return
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (ratingFilter !== 'all') {
        params.minRating = parseInt(ratingFilter)
        params.maxRating = parseInt(ratingFilter)
      }
      if (courseFilter !== 'all') {
        params.courseId = courseFilter
      }
      const response = await ReviewsAPI.getReviews(params)
      setReviews(response.reviews || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Local search filtering (API doesn't support search, so we filter locally)
  const filteredReviews = reviews.filter((review) => {
    if (searchTerm) {
      const courseTitle = (review as any).course?.title || ''
      const comment = review.comment || ''
      const userName = (review as any).user?.username || ''
      const searchLower = searchTerm.toLowerCase()
      return (
        courseTitle.toLowerCase().includes(searchLower) ||
        comment.toLowerCase().includes(searchLower) ||
        userName.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Calculate stats (use pagination total if available, otherwise use current reviews length)
  const totalReviews = pagination.total > 0 ? pagination.total : reviews.length
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) *
          100
        : 0,
  }))

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Reviews</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
              <p className="text-muted-foreground">
                View and manage course reviews
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reviews
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReviews}</div>
                <p className="text-xs text-muted-foreground">
                  All course reviews
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of 5.0 stars
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  5 Star Reviews
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ratingDistribution[0].count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ratingDistribution[0].percentage.toFixed(0)}% of all reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Reviews</CardTitle>
                  <CardDescription>
                    Manage and view all course reviews
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Rating
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setRatingFilter('all')}>
                        All Ratings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('5')}>
                        5 Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('4')}>
                        4 Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('3')}>
                        3 Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('2')}>
                        2 Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('1')}>
                        1 Star
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredReviews.length > 0 ? (
                <div className="space-y-4">
                  {filteredReviews.map((review) => {
                    const user = (review as any).user
                    const course = (review as any).course
                    const userName = user?.username || 'Unknown'
                    const userAvatar = user?.avatar
                    const initials = userName.substring(0, 2).toUpperCase()
                    const courseTitle = course?.title || 'Unknown Course'

                    return (
                      <div
                        key={review.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={userAvatar} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{userName}</p>
                                <Separator orientation="vertical" className="h-4" />
                                <p className="text-sm text-muted-foreground truncate">
                                  {courseTitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                {renderStars(review.rating)}
                                <span
                                  className={`text-sm font-medium ${getRatingColor(
                                    review.rating
                                  )}`}
                                >
                                  {review.rating}.0
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {formatDate(review.createdAt)}
                                </span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No reviews found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && filteredReviews.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

