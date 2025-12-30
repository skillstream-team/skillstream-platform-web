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
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { 
  BookOpen, 
  Clock, 
  Star,
  Bookmark,
  BookmarkCheck,
  Users,
  CheckCircle2,
  PlayCircle,
  ArrowLeft,
  Award,
  FileText,
  Video,
  HelpCircle,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  Copy,
  ExternalLink,
  Lock
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useParams, useNavigate, Link } from "react-router-dom"
import { CoursesAPI } from "@/api/courses.api"
import { WishlistAPI } from "@/api/wishlist.api"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ReviewsAPI } from "@/api/reviews.api"
import { Course, Module, Lesson, Review } from "@/api/types"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProgressAPI } from "@/api/progress.api"
import { PrerequisitesAPI, Prerequisite } from "@/api/prerequisites.api"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"

interface CourseDetail extends Course {
  modules?: Module[]
  learningObjectives?: string[]
  requirements?: string[]
}

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const { settings } = useSystemSettings()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasCompletedCourse, setHasCompletedCourse] = useState(false)
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
  const [prerequisitesLoading, setPrerequisitesLoading] = useState(false)
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current || !courseId) return
    hasFetched.current = true
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const courseData = await CoursesAPI.getCourse(courseId)
      setCourse(courseData as CourseDetail)
      
      // Check if enrolled
      let enrolled = false
      try {
        const enrollments = await EnrollmentsAPI.getEnrollments({ courseId })
        const userEnrollment = enrollments.enrollments?.find(
          (e: any) => e.studentId === currentUser?.id
        )
        enrolled = !!userEnrollment
        setIsEnrolled(enrolled)
      } catch (error) {
        setIsEnrolled(false)
      }
      
      // Check wishlist
      try {
        const wishlistCheck = await WishlistAPI.isInWishlist(courseId)
        setIsInWishlist(wishlistCheck.inWishlist)
      } catch (error) {
        setIsInWishlist(false)
      }
      
      // Check if course is completed (to allow reviews)
      if (currentUser?.id && enrolled) {
        try {
          const progress = await ProgressAPI.getCourseProgress(courseId, currentUser.id)
          setHasCompletedCourse(progress?.status === 'completed' || (progress?.completionPercentage || 0) >= 100)
        } catch (error) {
          setHasCompletedCourse(false)
        }
      }
      
      // Fetch reviews
      fetchReviews()
      
      // Fetch prerequisites
      fetchPrerequisites()
      
      // Fetch related courses
      fetchRelatedCourses(courseData.categoryId)
    } catch (error: any) {
      console.error('Failed to fetch course:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!courseId) return
    try {
      setEnrolling(true)
      await EnrollmentsAPI.enroll(courseId)
      setIsEnrolled(true)
      toast.success('Successfully enrolled in course!')
    } catch (error: any) {
      console.error('Failed to enroll:', error)
      toast.error(error?.response?.data?.message || 'Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  const toggleWishlist = async () => {
    if (!courseId) return
    try {
      if (isInWishlist) {
        await WishlistAPI.removeFromWishlist(courseId)
        setIsInWishlist(false)
        toast.success('Removed from wishlist')
      } else {
        await WishlistAPI.addToWishlist(courseId)
        setIsInWishlist(true)
        toast.success('Added to wishlist')
      }
    } catch (error: any) {
      console.error('Failed to update wishlist:', error)
      toast.error('Failed to update wishlist')
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const fetchReviews = async () => {
    if (!courseId) return
    try {
      setReviewLoading(true)
      const response = await ReviewsAPI.getReviews({ courseId, limit: 50 })
      setReviews(response.reviews || [])
      setAverageRating(response.averageRating || 0)
      setTotalReviews(response.totalReviews || response.reviews?.length || 0)
      
      // Find user's review
      const currentUserReview = response.reviews?.find((r: Review) => r.userId === currentUser?.id)
      setUserReview(currentUserReview || null)
      
      if (currentUserReview) {
        setReviewRating(currentUserReview.rating)
        setReviewComment(currentUserReview.comment || '')
        setShowReviewForm(true)
      }
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error)
      if (error?.response?.status !== 401) {
        // Don't show error for unauthorized, just use empty data
      }
    } finally {
      setReviewLoading(false)
    }
  }
  
  const fetchPrerequisites = async () => {
    if (!courseId) return
    try {
      setPrerequisitesLoading(true)
      const prereqs = await PrerequisitesAPI.getPrerequisites(courseId)
      setPrerequisites(prereqs || [])
    } catch (error: any) {
      console.error('Failed to fetch prerequisites:', error)
    } finally {
      setPrerequisitesLoading(false)
    }
  }
  
  const fetchRelatedCourses = async (categoryId?: string) => {
    if (!categoryId) return
    try {
      const response = await CoursesAPI.getCourses({ 
        categoryId, 
        limit: 8
      })
      const courses = response.courses || []
      // Filter out current course
      setRelatedCourses(courses.filter((c: Course) => c.id !== courseId).slice(0, 4))
    } catch (error: any) {
      console.error('Failed to fetch related courses:', error)
    }
  }
  
  const handleShareCourse = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Course link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareToTwitter = () => {
    const url = window.location.href
    const text = `Check out this course: ${course?.title || ''}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const handleShareToLinkedIn = () => {
    const url = window.location.href
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedInUrl, '_blank', 'width=550,height=420')
  }

  const handleShareToFacebook = () => {
    const url = window.location.href
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank', 'width=550,height=420')
  }

  const handleSubmitReview = async () => {
    if (!courseId || reviewRating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    try {
      setSubmittingReview(true)
      if (userReview) {
        // Update existing review
        const updated = await ReviewsAPI.updateReview(userReview.id, {
          rating: reviewRating,
          comment: reviewComment,
        })
        setUserReview(updated)
        toast.success('Review updated successfully')
      } else {
        // Create new review
        const newReview = await ReviewsAPI.createReview({
          courseId,
          rating: reviewRating,
          comment: reviewComment,
        })
        setUserReview(newReview)
        toast.success('Review submitted successfully')
      }
      
      // Refresh reviews list
      await fetchReviews()
      setShowReviewForm(false)
    } catch (error: any) {
      console.error('Failed to submit review:', error)
      toast.error(error?.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview || !courseId) return
    
    try {
      await ReviewsAPI.deleteReview(userReview.id)
      setUserReview(null)
      setReviewRating(0)
      setReviewComment('')
      setShowReviewForm(false)
      toast.success('Review deleted successfully')
      await fetchReviews()
    } catch (error: any) {
      console.error('Failed to delete review:', error)
      toast.error('Failed to delete review')
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!course) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">Course not found</h3>
                <Button onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
                  <Link to="/courses">Browse Courses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{course.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Hero Section */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/courses')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
                {course.description && (
                  <p className="text-muted-foreground text-lg">{course.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {course.instructor && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={course.instructor.avatar} />
                      <AvatarFallback>
                        {(course.instructor.firstName?.[0] || course.instructor.username[0])?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {course.instructor.firstName && course.instructor.lastName
                        ? `${course.instructor.firstName} ${course.instructor.lastName}`
                        : course.instructor.username}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {course.duration} minutes
                </div>
                {course.difficulty && (
                  <Badge variant="outline">{course.difficulty}</Badge>
                )}
              </div>
            </div>

            {/* Enrollment Card */}
            <Card className="md:col-span-1 h-fit">
              <CardHeader>
                {course.thumbnailUrl && (
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="text-2xl font-bold mb-2">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/courses/${course.id}/learn`)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                ) : (
                  <>
                    {/* Find first preview lesson */}
                    {(course as any).modules && (course as any).modules.some((m: any) => m.lessons?.some((l: Lesson) => l.isPreview)) && (
                      <Button 
                        className="w-full mb-2" 
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          // Find first preview lesson
                          for (const module of (course as any).modules || []) {
                            const previewLesson = (module as any).lessons?.find((l: Lesson) => l.isPreview)
                            if (previewLesson) {
                              navigate(`/courses/${course.id}/learn/${previewLesson.id}?preview=true`)
                              return
                            }
                          }
                        }}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Preview Course (Free)
                      </Button>
                    )}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={toggleWishlist}
                >
                  {isInWishlist ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                      Remove from Wishlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Add to Wishlist
                    </>
                  )}
                </Button>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleShareCourse}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={handleShareToTwitter}
                    >
                      Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={handleShareToLinkedIn}
                    >
                      LinkedIn
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={handleShareToFacebook}
                    >
                      Facebook
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
                <CardDescription>
                  Complete these courses before starting this one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prerequisites.map((prereq) => (
                    <div key={prereq.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {prereq.prerequisiteCourse?.title || 'Course'}
                          </div>
                          {prereq.prerequisiteCourse?.description && (
                            <div className="text-sm text-muted-foreground">
                              {prereq.prerequisiteCourse.description.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => prereq.prerequisiteCourse && navigate(`/courses/${prereq.prerequisiteCourse.id}`)}
                      >
                        View Course
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Content */}
          {course.modules && course.modules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {course.modules.length} {course.modules.length === 1 ? 'module' : 'modules'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.modules.map((module, moduleIndex) => (
                    <Collapsible
                      key={module.id}
                      open={expandedModules.has(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                              {moduleIndex + 1}
                            </div>
                            <div>
                              <div className="font-medium">{module.title}</div>
                              {module.description && (
                                <div className="text-sm text-muted-foreground">
                                  {module.description}
                                </div>
                              )}
                              {(module as any).lessons && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {(module as any).lessons.length} {(module as any).lessons.length === 1 ? 'lesson' : 'lessons'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-12 mt-2 space-y-2 pl-4 border-l-2">
                          {(module as any).lessons?.map((lesson: Lesson) => (
                            <div 
                              key={lesson.id}
                              className={`flex items-center gap-3 p-3 rounded-lg ${lesson.isPreview || isEnrolled ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'}`}
                              onClick={() => {
                                if (lesson.isPreview || isEnrolled) {
                                  navigate(`/courses/${course.id}/learn/${lesson.id}`)
                                }
                              }}
                            >
                              <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{lesson.title}</div>
                                {lesson.duration && (
                                  <div className="text-xs text-muted-foreground">
                                    {lesson.duration} minutes
                                  </div>
                                )}
                              </div>
                              {lesson.isPreview && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Preview
                                </Badge>
                              )}
                              {!isEnrolled && !lesson.isPreview && (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Objectives */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What you'll learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 md:grid-cols-2">
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {course.requirements.map((requirement, index) => (
                    <li key={index} className="text-muted-foreground">
                      {requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          {settings?.enableReviews !== false && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    Reviews
                    {totalReviews > 0 && (
                      <span className="text-lg font-normal text-muted-foreground">
                        ({totalReviews})
                      </span>
                    )}
                  </CardTitle>
                  {averageRating > 0 && (
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <span className="text-muted-foreground">average rating</span>
                    </CardDescription>
                  )}
                </div>
                {isEnrolled && hasCompletedCourse && !userReview && (
                  <Button onClick={() => setShowReviewForm(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="reviews" className="w-full">
                <TabsList>
                  <TabsTrigger value="reviews">All Reviews</TabsTrigger>
                  {isEnrolled && hasCompletedCourse && (
                    <TabsTrigger value="my-review">My Review</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="reviews" className="space-y-4 mt-4">
                  {/* Review Form */}
                  {showReviewForm && isEnrolled && hasCompletedCourse && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {userReview ? 'Edit Your Review' : 'Write a Review'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewRating(rating)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-6 w-6 ${
                                    rating <= reviewRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  } hover:fill-yellow-300 hover:text-yellow-300 transition-colors`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Comment</label>
                          <Textarea
                            placeholder="Share your thoughts about this course..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || reviewRating === 0}
                          >
                            {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false)
                              if (!userReview) {
                                setReviewRating(0)
                                setReviewComment('')
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          {userReview && (
                            <Button
                              variant="destructive"
                              onClick={handleDeleteReview}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  {reviewLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id} className={review.id === userReview?.id ? 'border-primary' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback>
                                      {review.user?.firstName?.[0] || review.user?.username?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {review.user?.firstName && review.user?.lastName
                                        ? `${review.user.firstName} ${review.user.lastName}`
                                        : review.user?.username || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <Star
                                      key={rating}
                                      className={`h-4 w-4 ${
                                        rating <= review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                              
                              {review.id === userReview?.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setShowReviewForm(true)
                                      setReviewRating(userReview.rating)
                                      setReviewComment(userReview.comment || '')
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={handleDeleteReview}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                        <p className="text-muted-foreground">
                          Be the first to review this course!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {isEnrolled && hasCompletedCourse && (
                  <TabsContent value="my-review" className="mt-4">
                    {userReview ? (
                      <Card className="border-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="font-semibold mb-2">Your Review</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {new Date(userReview.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setShowReviewForm(true)
                                  setReviewRating(userReview.rating)
                                  setReviewComment(userReview.comment || '')
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={handleDeleteReview}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Star
                                key={rating}
                                className={`h-5 w-5 ${
                                  rating <= userReview.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {userReview.comment && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {userReview.comment}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="text-lg font-semibold mb-2">No review yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Share your experience with this course
                          </p>
                          <Button onClick={() => setShowReviewForm(true)}>
                            Write a Review
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
          )}
          
          {/* Related Courses */}
          {relatedCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Courses</CardTitle>
                <CardDescription>
                  You might also be interested in these courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {relatedCourses.map((relatedCourse) => (
                    <Card key={relatedCourse.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/courses/${relatedCourse.id}`)}>
                      {relatedCourse.thumbnailUrl && (
                        <img
                          src={relatedCourse.thumbnailUrl}
                          alt={relatedCourse.title}
                          className="w-full h-32 object-cover rounded-t-lg"
                        />
                      )}
                      <CardHeader>
                        <CardTitle className="text-base">{relatedCourse.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {relatedCourse.description?.substring(0, 80)}...
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {relatedCourse.price === 0 ? 'Free' : `$${relatedCourse.price}`}
                          </span>
                          {relatedCourse.difficulty && (
                            <Badge variant="outline">{relatedCourse.difficulty}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

