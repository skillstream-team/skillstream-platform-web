import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
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
import { 
  BookOpen, 
  Clock, 
  Search,
  Filter,
  ChevronDown,
  Star,
  Bookmark,
  BookmarkCheck,
  Users,
  TrendingUp
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { CoursesAPI } from "@/api/courses.api"
import { WishlistAPI } from "@/api/wishlist.api"
import { CategoriesAPI, Category } from "@/api/categories.api"
import { Course, Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BrowseCourses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
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
    fetchCategories()
    fetchCourses()
    fetchWishlist()
  }, [])

  useEffect(() => {
    if (!hasFetched.current) return
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, difficultyFilter, sortBy])

  useEffect(() => {
    if (!hasFetched.current) return
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchCategories = async () => {
    try {
      const response = await CategoriesAPI.getCategories({ limit: 100 })
      setCategories(response.categories || [])
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    }
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      if (selectedCategory !== 'all') {
        params.categoryId = selectedCategory
      }
      
      if (difficultyFilter !== 'all') {
        params.difficulty = difficultyFilter
      }
      
      // Map sortBy to API sortBy and sortOrder
      switch (sortBy) {
        case 'newest':
          params.sortBy = 'createdAt'
          params.sortOrder = 'desc'
          break
        case 'oldest':
          params.sortBy = 'createdAt'
          params.sortOrder = 'asc'
          break
        case 'title':
          params.sortBy = 'title'
          params.sortOrder = 'asc'
          break
        case 'popular':
          params.sortBy = 'rating'
          params.sortOrder = 'desc'
          break
      }
      
      const response = await CoursesAPI.getCourses(params)
      setCourses(response.courses || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWishlist = async () => {
    try {
      const wishlistResponse = await WishlistAPI.getWishlist({ limit: 100 })
      const wishlistCourseIds = new Set((wishlistResponse.courses || []).map(c => c.id))
      setWishlistIds(wishlistCourseIds)
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch wishlist:', error)
      }
    }
  }

  const toggleWishlist = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation()
    try {
      if (wishlistIds.has(courseId)) {
        await WishlistAPI.removeFromWishlist(courseId)
        setWishlistIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(courseId)
          return newSet
        })
      } else {
        await WishlistAPI.addToWishlist(courseId)
        setWishlistIds(prev => new Set(prev).add(courseId))
      }
    } catch (error: any) {
      console.error('Failed to update wishlist:', error)
    }
  }

  const difficultyLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Browse Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
            <p className="text-muted-foreground mt-1">
              Discover and enroll in courses to start learning
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Category: {categories.find(c => c.id === selectedCategory)?.name || 'All'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  All Categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {difficultyLevels.find(d => d.value === difficultyFilter)?.label || 'All Levels'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {difficultyLevels.map((level) => (
                  <DropdownMenuItem 
                    key={level.value}
                    onClick={() => setDifficultyFilter(level.value)}
                  >
                    {level.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'title' ? 'Title' : 'Popular'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')}>
                  Title (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-muted-foreground">
              {pagination.total} {pagination.total === 1 ? 'course' : 'courses'} found
            </div>
          )}

          {/* Courses Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="relative">
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-blue-400" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={(e) => toggleWishlist(e, course.id)}
                    >
                      {wishlistIds.has(course.id) ? (
                        <BookmarkCheck className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </Button>
                    {course.difficulty && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2"
                      >
                        {course.difficulty}
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3" />
                      {course.duration} min
                      {course.instructor && (
                        <>
                          <span className="mx-1">•</span>
                          {course.instructor.firstName || course.instructor.username}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {course.price !== undefined && (
                        <div className="text-lg font-bold">
                          ${course.price === 0 ? 'Free' : course.price}
                        </div>
                      )}
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/courses/${course.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setDifficultyFilter('all')
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {!loading && courses.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center">
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

