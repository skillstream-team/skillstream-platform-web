import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useNavigate } from "react-router-dom"
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
import { Separator } from "@/components/ui/separator"
import { 
  Calendar,
  Clock,
  BookOpen,
  Save,
  ArrowLeft,
  Link as LinkIcon,
  DollarSign,
  Users,
  X
} from "lucide-react"
import { useState, useEffect } from "react"
import { LessonsAPI, QuickLessonPayload } from "@/api/lessons.api"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { StudentsAPI } from "@/api/students.api"
import { User } from "@/api/types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UsersAPI } from "@/api/users.api"
import { useCallback, useRef } from "react"

export function ScheduleLesson() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<User[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState<QuickLessonPayload>({
    title: '',
    description: '',
    teacherId: currentUser?.id || '',
    scheduledAt: '',
    subject: '',
    duration: 60,
    price: 0,
    studentIds: [],
  })

  const searchStudents = useCallback(async (search: string) => {
    if (!search.trim() || search.length < 2) {
      setStudents([])
      return
    }

    try {
      setLoadingStudents(true)
      console.log('Searching for students with query:', search.trim())
      const response = await UsersAPI.searchUsers({
        q: search.trim(),
        limit: 50,
        role: 'STUDENT'
      })
      console.log('Search response:', response)
      setStudents(response.data || [])
    } catch (error: any) {
      console.error('Failed to search students:', error)
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText
      })
      
      // Handle specific error cases
      if (error?.response?.status === 500) {
        toast.error('Server error: The search endpoint may not be implemented yet. Please contact support.')
      } else if (error?.response?.status === 404) {
        toast.error('Search endpoint not found. Please contact support.')
      } else {
        toast.error(error?.response?.data?.message || 'Failed to search students. Please try again.')
      }
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (studentSearchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchStudents(studentSearchTerm)
      }, 300)
    } else {
      setStudents([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [studentSearchTerm, searchStudents])

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        const updated = prev.filter(id => id !== studentId)
        setFormData(prevData => ({ ...prevData, studentIds: updated }))
        return updated
      } else {
        const updated = [...prev, studentId]
        setFormData(prevData => ({ ...prevData, studentIds: updated }))
        return updated
      }
    })
  }

  const removeStudent = (studentId: string) => {
    toggleStudent(studentId)
  }

  const getSelectedStudents = () => {
    return students.filter(student => selectedStudentIds.includes(student.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.scheduledAt || !formData.teacherId) {
      toast.error('Please fill in all required fields')
      return
    }
    if (formData.price === undefined || formData.price < 0) {
      toast.error('Please enter a valid price (0 or greater)')
      return
    }

    try {
      setLoading(true)
      const response = await LessonsAPI.createQuickLesson(formData)
      toast.success('Private lesson scheduled successfully!')
      navigate('/lessons/upcoming')
    } catch (error: any) {
      console.error('Failed to schedule lesson:', error)
      toast.error('Failed to schedule private lesson. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
                  <Link to="/lessons/upcoming">Lessons</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Schedule Private Lesson</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/lessons/upcoming')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Schedule Private Lesson</h1>
              <p className="text-muted-foreground">
                Create a new private lesson session with students
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Private Lesson Details</CardTitle>
              <CardDescription>
                Fill in the information to schedule your private lesson
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium leading-none">
                    Lesson Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Introduction to React Hooks"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium leading-none">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what will be covered..."
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium leading-none flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Subject
                    </label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Web Development"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium leading-none flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Duration (minutes) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                      min="15"
                      max="480"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="scheduledAt" className="text-sm font-medium leading-none flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Scheduled Date & Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium leading-none flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Price ($) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                {/* Student Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Students (Optional)
                  </label>
                  
                  {/* Selected Students Display */}
                  {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                      {getSelectedStudents().map(student => (
                        <Badge key={student.id} variant="secondary" className="flex items-center gap-1">
                          {student.firstName && student.lastName 
                            ? `${student.firstName} ${student.lastName}`
                            : student.username || student.email}
                          <button
                            type="button"
                            onClick={() => removeStudent(student.id)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Student Search and Selection */}
                  <div className="relative">
                    <Input
                      placeholder="Search students by name, email, or username..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Students List */}
                  {studentSearchTerm.trim().length >= 2 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {loadingStudents ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Searching students...
                        </div>
                      ) : students.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No students found
                        </div>
                      ) : (
                        <div className="divide-y">
                          {students.map(student => (
                            <div
                              key={student.id}
                              onClick={() => toggleStudent(student.id)}
                              className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedStudentIds.includes(student.id) ? 'bg-primary/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {student.firstName && student.lastName
                                      ? `${student.firstName} ${student.lastName}`
                                      : student.username || 'No name'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {student.email}
                                  </p>
                                </div>
                                {selectedStudentIds.includes(student.id) && (
                                  <div className="ml-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-xs text-primary-foreground">✓</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedStudentIds.length === 0 && studentSearchTerm.trim().length < 2 && (
                    <p className="text-xs text-muted-foreground">
                      Type at least 2 characters to search for students to invite to this lesson
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate('/lessons/upcoming')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Scheduling...' : 'Schedule Private Lesson'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

