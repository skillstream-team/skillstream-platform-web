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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  Clock,
  Send,
  Trash2
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { InstructorQAAPI, Question } from "@/api/instructor-qa.api"
import { CoursesAPI } from "@/api/courses.api"
import { toast } from "sonner"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"

export function CourseQA() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBy, setFilterBy] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answering, setAnswering] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)
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
    if (hasFetched.current || !courseId) return
    hasFetched.current = true

    fetchData()
  }, [courseId])

  useEffect(() => {
    if (!hasFetched.current || !courseId) return
    // Reset to page 1 when filter changes
    if (pagination.page === 1) {
      fetchData()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBy])

  useEffect(() => {
    if (!hasFetched.current || !courseId) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  const fetchData = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const [courseData, questionsData] = await Promise.all([
        CoursesAPI.getCourse(courseId),
        InstructorQAAPI.getQuestions(courseId, {
          page: pagination.page,
          limit: pagination.limit,
          answered: filterBy === 'all' ? undefined : filterBy === 'answered'
        })
      ])
      setCourse(courseData)
      setQuestions(questionsData.questions || [])
      setPagination(questionsData.pagination)
    } catch (error: any) {
      console.error('Failed to fetch Q&A:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setQuestions([])
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async () => {
    if (!selectedQuestion || !answerText.trim() || !courseId) return

    try {
      setAnswering(true)
      await InstructorQAAPI.answerQuestion(courseId, selectedQuestion.id, {
        answer: answerText.trim()
      })
      setAnswerText('')
      setSelectedQuestion(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to answer question:', error)
      toast.error('Failed to submit answer. Please try again.')
    } finally {
      setAnswering(false)
    }
  }

  const handleDeleteClick = (questionId: string) => {
    setQuestionToDelete(questionId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!questionToDelete || !courseId) return

    try {
      await InstructorQAAPI.deleteQuestion(courseId, questionToDelete)
      toast.success('Question deleted successfully')
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete question:', error)
      toast.error('Failed to delete question. Please try again.')
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

  // Local search filtering (API doesn't support search parameter)
  const filteredQuestions = questions.filter((question) => {
    if (searchTerm) {
      return question.question.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const unansweredCount = questions.filter(q => !q.answer).length

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
                  <Link to="/courses">Courses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Q&A</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {course?.title || 'Course'} Q&A
              </h1>
              <p className="text-muted-foreground">
                Answer student questions about your course
              </p>
            </div>
            {unansweredCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                {unansweredCount} unanswered
              </Badge>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions & Answers</CardTitle>
                  <CardDescription>
                    Manage student questions and provide answers
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterBy('all')}>
                        All Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy('answered')}>
                        Answered
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy('unanswered')}>
                        Unanswered
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => {
                    const student = (question as any).student || {}
                    const initials = student.username?.substring(0, 2).toUpperCase() || 'S'

                    return (
                      <Card key={question.id} className={!question.answer ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium">
                                      {student.username || 'Unknown Student'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(question.createdAt)}
                                    </p>
                                  </div>
                                  {!question.answer && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Unanswered
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{question.question}</p>
                              </div>

                              {question.answer && (
                                <>
                                  <Separator />
                                  <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="font-medium text-sm">Your Answer</p>
                                      {question.answeredAt && (
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(question.answeredAt)}
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
                                  </div>
                                </>
                              )}

                              {!question.answer && (
                                <>
                                  <Separator />
                                  <div className="space-y-2">
                                    <textarea
                                      placeholder="Type your answer here..."
                                      value={selectedQuestion?.id === question.id ? answerText : ''}
                                      onChange={(e) => {
                                        setAnswerText(e.target.value)
                                        setSelectedQuestion(question)
                                      }}
                                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteClick(question.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleAnswer}
                                        disabled={!answerText.trim() || answering || selectedQuestion?.id !== question.id}
                                      >
                                        <Send className="h-4 w-4 mr-2" />
                                        {answering ? 'Sending...' : 'Send Answer'}
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No questions found</p>
                  <p className="text-sm mt-2">Students will see their questions appear here</p>
                </div>
              )}

              {/* Pagination */}
              {!loading && filteredQuestions.length > 0 && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this question? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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

