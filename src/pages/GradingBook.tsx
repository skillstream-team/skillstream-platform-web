import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useParams } from "react-router-dom"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { QuizzesAPI, QuizAttempt } from "@/api/quizzes.api"
import { CoursesAPI } from "@/api/courses.api"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/api/apiClient"

export function GradingBook() {
  const { courseId } = useParams<{ courseId: string }>()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [attemptsLoading, setAttemptsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchQuizzes()
  }, [courseId])

  useEffect(() => {
    if (selectedQuiz) {
      fetchAttempts(selectedQuiz)
    }
  }, [selectedQuiz])

  const fetchQuizzes = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      // Fetch course to get its structure
      const course = await CoursesAPI.getCourse(courseId)
      
      // Extract all quizzes from course modules/lessons
      // Note: This assumes the course response includes full structure
      // If not, we may need to fetch modules/lessons separately
      const allQuizzes: any[] = []
      
      // Try to get quizzes from course structure if available
      // Otherwise, we'll need to fetch modules and lessons
      if ((course as any).modules) {
        (course as any).modules.forEach((module: any) => {
          if (module.lessons) {
            module.lessons.forEach((lesson: any) => {
              if (lesson.quizzes) {
                allQuizzes.push(...lesson.quizzes.map((quiz: any) => ({
                  ...quiz,
                  moduleTitle: module.title,
                  lessonTitle: lesson.title,
                })))
              }
            })
          }
        })
      }
      
      setQuizzes(allQuizzes)
    } catch (error: any) {
      console.error('Failed to fetch quizzes:', error)
      // Fallback: try to get quizzes directly if API supports it
      try {
        // If there's a direct endpoint for course quizzes, use it
        const response = await apiClient.instance.get(`/courses/${courseId}/quizzes`)
        setQuizzes(response.data || [])
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError)
        setQuizzes([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAttempts = async (quizId: string) => {
    try {
      setAttemptsLoading(true)
      const response = await QuizzesAPI.getQuizAttempts(quizId)
      setAttempts(response || [])
    } catch (error: any) {
      console.error('Failed to fetch attempts:', error)
      setAttempts([])
    } finally {
      setAttemptsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getGradeColor = (score?: number, maxScore: number = 100) => {
    if (!score) return 'text-muted-foreground'
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredAttempts = attempts.filter((attempt) => {
    if (searchTerm) {
      // Search by student name if available
      return true
    }
    return true
  })

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
                <BreadcrumbLink asChild>
                  <Link to="/students/enrollments">Enrollments</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Grading Book</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grading Book</h1>
            <p className="text-muted-foreground">
              Grade and manage student quiz submissions
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Quiz Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>Select a quiz to grade</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : quizzes.length > 0 ? (
                  <div className="space-y-2">
                    {quizzes.map((quiz) => (
                      <Button
                        key={quiz.id}
                        variant={selectedQuiz === quiz.id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedQuiz(quiz.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {quiz.title}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No quizzes available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Attempts List */}
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quiz Attempts</CardTitle>
                    <CardDescription>
                      {selectedQuiz ? 'Student submissions to grade' : 'Select a quiz to view attempts'}
                    </CardDescription>
                  </div>
                  {selectedQuiz && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedQuiz ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a quiz to view student attempts</p>
                  </div>
                ) : attemptsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {(attempt as any).user?.username?.[0]?.toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {(attempt as any).user?.username || 'Unknown Student'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDate(attempt.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {attempt.score !== undefined ? (
                              <>
                                <p className={`font-bold ${getGradeColor(attempt.score)}`}>
                                  {attempt.score}%
                                </p>
                                {attempt.score >= 70 ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Passed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Grade
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No attempts found for this quiz</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

