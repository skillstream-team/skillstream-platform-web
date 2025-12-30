import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useParams, useNavigate } from "react-router-dom"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  FileText,
  HelpCircle,
  Clock,
  Loader2,
  X
} from "lucide-react"
import { useState, useEffect } from "react"
import { CoursesAPI } from "@/api/courses.api"
import { LessonsAPI } from "@/api/lessons.api"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { Course, Module as ModuleType, Lesson as LessonType } from "@/api/types"
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"

interface Module extends Omit<ModuleType, 'createdAt'> {
  createdAt?: string
  lessons: Lesson[]
}

interface Lesson extends Omit<LessonType, 'createdAt'> {
  createdAt?: string
  quizzes: any[]
}

export function CourseBuilder() {
  const { courseId: id } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  
  // Module creation state
  const [creatingModule, setCreatingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  
  // Module editing state
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState("")
  const [editModuleDescription, setEditModuleDescription] = useState("")
  const [savingModule, setSavingModule] = useState<string | null>(null)
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<'module' | 'lesson' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ moduleId?: string; lessonId?: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Refresh when navigating to this page
  useRefreshOnNavigation(() => {
    if (id) {
      fetchCourseData()
    }
  })

  const fetchCourseData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [courseData, modulesData] = await Promise.all([
        CoursesAPI.getCourse(id),
        CoursesAPI.getModules(id).catch(() => [])
      ])
      setCourse(courseData)
      
      // Transform modules data
      const transformedModules: Module[] = modulesData.map((module: any) => ({
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        description: module.description || '',
        order: module.order,
        lessons: (module.lessons || []).map((lesson: any) => ({
          id: lesson.id,
          courseId: lesson.courseId,
          title: lesson.title,
          description: lesson.description || '',
          order: lesson.order,
          duration: lesson.duration || 10,
          isPreview: lesson.isPreview || false,
          quizzes: lesson.quizzes || []
        }))
      }))
      
      setModules(transformedModules)
      // Expand all modules by default
      setExpandedModules(new Set(transformedModules.map(m => m.id)))
    } catch (error: any) {
      console.error('Failed to fetch course:', error)
      toast.error('Failed to load course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId)
    } else {
      newExpanded.add(lessonId)
    }
    setExpandedLessons(newExpanded)
  }

  const handleCreateModule = async () => {
    if (!id) {
      toast.error("Course ID is missing")
      return
    }

    const title = newModuleTitle.trim()
    if (!title) {
      toast.error("Module title is required")
      return
    }

    setCreatingModule(true)
    const currentUser = getCurrentUser()
    const createdBy = currentUser?.id || ""

    try {
      const newModule = await CoursesAPI.addModule(id, {
        title,
        description: newModuleDescription.trim() || "",
        order: modules.length + 1,
        createdBy,
      })
      
      // Add to local state
      setModules([...modules, { ...newModule, lessons: [] }])
      setExpandedModules(prev => new Set([...prev, newModule.id]))
      
      // Reset form
      setNewModuleTitle("")
      setNewModuleDescription("")
      toast.success("Module created successfully!")
    } catch (error: any) {
      console.error("Failed to create module:", error)
      const errorMessage = error?.message || error?.response?.data?.error || error?.response?.data?.message || "Failed to create module. Please try again."
      toast.error(errorMessage)
    } finally {
      setCreatingModule(false)
    }
  }

  const startEditModule = (module: Module) => {
    setEditingModuleId(module.id)
    setEditModuleTitle(module.title)
    setEditModuleDescription(module.description || "")
  }

  const cancelEditModule = () => {
    setEditingModuleId(null)
    setEditModuleTitle("")
    setEditModuleDescription("")
  }

  const handleUpdateModule = async (moduleId: string) => {
    if (!id) {
      toast.error("Course ID is missing")
      return
    }

    const title = editModuleTitle.trim()
    if (!title) {
      toast.error("Module title is required")
      return
    }

    setSavingModule(moduleId)
    try {
      const updatedModule = await CoursesAPI.updateModule(id, moduleId, {
        title,
        description: editModuleDescription.trim() || "",
      })
      
      // Update local state
      setModules(modules.map(m => 
        m.id === moduleId 
          ? { ...updatedModule, lessons: m.lessons }
          : m
      ))
      
      setEditingModuleId(null)
      toast.success("Module updated successfully!")
    } catch (error: any) {
      console.error("Failed to update module:", error)
      const errorMessage = error?.message || error?.response?.data?.error || error?.response?.data?.message || "Failed to update module. Please try again."
      toast.error(errorMessage)
    } finally {
      setSavingModule(null)
    }
  }

  const handleDeleteModule = (moduleId: string) => {
    setDeleteType('module')
    setDeleteTarget({ moduleId })
    setDeleteDialogOpen(true)
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    setDeleteType('lesson')
    setDeleteTarget({ moduleId, lessonId })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteType || !id) return

    setDeleting(true)
    try {
      if (deleteType === 'module' && deleteTarget.moduleId) {
        await CoursesAPI.deleteModule(id, deleteTarget.moduleId)
        setModules(modules.filter(m => m.id !== deleteTarget.moduleId))
        toast.success("Module deleted successfully!")
      } else if (deleteType === 'lesson' && deleteTarget.lessonId) {
        await LessonsAPI.deleteLesson(deleteTarget.lessonId)
        setModules(modules.map(m =>
          m.id === deleteTarget.moduleId
            ? { ...m, lessons: m.lessons.filter(l => l.id !== deleteTarget.lessonId) }
            : m
        ))
        toast.success("Lesson deleted successfully!")
      }
      // Refresh data to ensure consistency
      await fetchCourseData()
    } catch (error: any) {
      console.error("Failed to delete:", error)
      const errorMessage = error?.message || error?.response?.data?.error || error?.response?.data?.message || "Failed to delete. Please try again."
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      setDeleteType(null)
    }
  }

  const handleAddLesson = (moduleId: string) => {
    if (!id) {
      toast.error("Course ID is missing")
      return
    }

    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    // Navigate to lesson editor with moduleId in URL
    navigate(`/courses/${id}/modules/${moduleId}/lessons/new`, {
      state: {
        moduleId: moduleId,
        moduleOrder: module.order,
        lessonOrder: (module.lessons || []).length + 1,
      }
    })
  }

  const handleEditLesson = (lessonId: string) => {
    if (!id) return
    navigate(`/courses/${id}/lessons/${lessonId}/edit`)
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/courses">Courses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Course Builder</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Course Builder</h1>
              <p className="text-muted-foreground">
                {course?.title || 'Loading...'} - Build your course structure
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>

          {/* Create Module Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Module</CardTitle>
              <CardDescription>
                Add a new module to organize your course content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Module Title *</label>
                  <Input
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="e.g., Introduction to Web Development"
                    disabled={creatingModule}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <textarea
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    placeholder="Brief description of what students will learn in this module"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={creatingModule}
                  />
                </div>
                <Button 
                  onClick={handleCreateModule} 
                  disabled={creatingModule || !newModuleTitle.trim()}
                >
                  {creatingModule ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Module
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Course Structure */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Structure</CardTitle>
                  <CardDescription>
                    {modules.length} {modules.length === 1 ? 'module' : 'modules'} in this course
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No modules yet. Create your first module above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module) => (
                    <Card key={module.id} className="border-2">
                      <CardHeader className="pb-3">
                        {editingModuleId === module.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editModuleTitle}
                              onChange={(e) => setEditModuleTitle(e.target.value)}
                              placeholder="Module title"
                              className="font-semibold"
                              disabled={savingModule === module.id}
                            />
                            <textarea
                              value={editModuleDescription}
                              onChange={(e) => setEditModuleDescription(e.target.value)}
                              placeholder="Module description (optional)"
                              rows={2}
                              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              disabled={savingModule === module.id}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateModule(module.id)}
                                disabled={savingModule === module.id || !editModuleTitle.trim()}
                              >
                                {savingModule === module.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelEditModule}
                                disabled={savingModule === module.id}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleModule(module.id)}
                                >
                                  {expandedModules.has(module.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                <Badge variant="outline">Module {module.order}</Badge>
                              </div>
                              {module.description && (
                                <p className="text-sm text-muted-foreground ml-8 mt-1">
                                  {module.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 ml-8 mt-2 text-xs text-muted-foreground">
                                <span>{module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}</span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <GripVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditModule(module)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Module
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddLesson(module.id)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Lesson
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteModule(module.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Module
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </CardHeader>
                      {expandedModules.has(module.id) && (
                        <CardContent className="pt-0">
                          {module.lessons.length === 0 ? (
                            <div className="ml-8 py-4 text-center border rounded-lg bg-muted/50">
                              <p className="text-sm text-muted-foreground mb-2">No lessons in this module</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAddLesson(module.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Lesson
                              </Button>
                            </div>
                          ) : (
                            <div className="ml-8 space-y-2">
                              {module.lessons.map((lesson) => (
                                <Card key={lesson.id} className="border">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => toggleLesson(lesson.id)}
                                          >
                                            {expandedLessons.has(lesson.id) ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{lesson.title}</span>
                                          {lesson.isPreview && (
                                            <Badge variant="secondary" className="text-xs">Preview</Badge>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            Lesson {lesson.order}
                                          </Badge>
                                        </div>
                                        {lesson.description && (
                                          <p className="text-sm text-muted-foreground ml-7 mt-1">
                                            {lesson.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-3 ml-7 mt-1 text-xs text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{lesson.duration} min</span>
                                          </div>
                                          {lesson.quizzes.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              <HelpCircle className="h-3 w-3" />
                                              <span>{lesson.quizzes.length} {lesson.quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <GripVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditLesson(lesson.id)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Lesson
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                            className="text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Lesson
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </CardHeader>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteType === 'module' ? 'Module' : 'Lesson'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'module' && "Are you sure you want to delete this module? All lessons in this module will be deleted. This action cannot be undone."}
              {deleteType === 'lesson' && "Are you sure you want to delete this lesson? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
