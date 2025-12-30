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
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  PlayCircle
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { LearningPathsAPI, LearningPath } from "@/api/learning-paths.api"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LearningPaths() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
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
    fetchLearningPaths()
  }, [])

  useEffect(() => {
    if (!hasFetched.current) return
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLearningPaths()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, difficultyFilter])

  useEffect(() => {
    if (!hasFetched.current) return
    fetchLearningPaths()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchLearningPaths = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      if (difficultyFilter !== 'all') {
        params.difficulty = difficultyFilter
      }
      
      const response = await LearningPathsAPI.getLearningPaths(params)
      setLearningPaths(response.learningPaths || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch learning paths:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setLearningPaths([])
    } finally {
      setLoading(false)
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
                <BreadcrumbPage>Learning Paths</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
            <p className="text-muted-foreground mt-1">
              Follow structured paths to master skills systematically
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search learning paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-muted-foreground">
              {pagination.total} {pagination.total === 1 ? 'path' : 'paths'} found
            </div>
          )}

          {/* Learning Paths Grid */}
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
          ) : learningPaths.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {learningPaths.map((path) => (
                <Card 
                  key={path.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/learning-paths/${path.id}`)}
                >
                  {path.thumbnailUrl ? (
                    <img 
                      src={path.thumbnailUrl} 
                      alt={path.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <TrendingUp className="h-16 w-16 text-purple-400" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-2 flex-1">{path.title}</CardTitle>
                      {path.difficulty && (
                        <Badge variant="outline" className="ml-2">
                          {path.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {path.courseIds && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {path.courseIds.length} {path.courseIds.length === 1 ? 'course' : 'courses'}
                          </div>
                        )}
                        {path.estimatedDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {path.estimatedDuration} hours
                          </div>
                        )}
                      </div>
                      
                      {path.courses && path.courses.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Includes:</div>
                          <div className="space-y-1">
                            {path.courses.slice(0, 3).map((course) => (
                              <div key={course.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="line-clamp-1">{course.title}</span>
                              </div>
                            ))}
                            {path.courses.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{path.courses.length - 3} more courses
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/learning-paths/${path.id}`)
                        }}
                      >
                        View Path
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No learning paths found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setDifficultyFilter('all')
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {!loading && learningPaths.length > 0 && pagination.totalPages > 1 && (
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

