import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useParams, useNavigate, useLocation } from "react-router-dom"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { 
  ArrowLeft,
  Save,
  Plus,
  Video,
  FileText,
  File,
  PenTool,
  Trash2,
  Edit,
  Eye,
  Upload,
  Link as LinkIcon,
  GripVertical,
  Clock,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { WhiteboardsAPI } from "@/api/whiteboards.api"
import { LessonsAPI } from "@/api/lessons.api"
import { CoursesAPI } from "@/api/courses.api"
import { Lesson } from "@/api/types"

interface VideoContent {
  id: string
  title: string
  playbackUrl: string
  thumbnailUrl?: string
  duration: number
  order: number
}

interface DocumentContent {
  id: string
  title: string
  fileUrl: string
  fileType: 'pdf' | 'doc' | 'docx' | 'other'
  fileSize?: number
  order: number
}

interface TextContent {
  id: string
  title: string
  content: string
  order: number
}

interface WhiteboardContent {
  id: string
  title: string
  order: number
}


export function LessonEditor() {
  const params = useParams<{ courseId: string; lessonId?: string; moduleId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Handle different route patterns:
  // 1. /courses/:courseId/lessons/new/edit - lessonId is 'new'
  // 2. /courses/:courseId/modules/:moduleId/lessons/new - no lessonId param, but path ends with /lessons/new
  const courseId = params.courseId
  const lessonId = params.lessonId
  const urlModuleId = params.moduleId
  const pathEndsWithNew = location.pathname.endsWith('/lessons/new')
  const isNewLesson = lessonId === 'new' || (!lessonId && pathEndsWithNew)
  
  // Get module info from location state or URL params if creating new lesson
  const stateModuleInfo = location.state as { moduleId?: string; moduleOrder?: number; lessonOrder?: number } | null
  const moduleInfo = stateModuleInfo || (urlModuleId ? { moduleId: urlModuleId } : null)
  
  // For new lessons, initialize immediately; for existing, start loading
  const [loading, setLoading] = useState(!isNewLesson)
  const hasFetched = useRef(false)
  
  // Initialize lesson data immediately for new lessons
  const [lessonData, setLessonData] = useState<Lesson | null>(() => {
    if (isNewLesson && courseId) {
      return {
        id: '',
        courseId: courseId,
        title: 'New Lesson',
        description: '',
        order: moduleInfo?.lessonOrder || 1,
        duration: 10,
        isPreview: false,
        moduleId: moduleInfo?.moduleId || urlModuleId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quizzes: [],
      } as Lesson
    }
    return null
  })
  const [videos, setVideos] = useState<VideoContent[]>([])
  const [documents, setDocuments] = useState<DocumentContent[]>([])
  const [textContent, setTextContent] = useState<TextContent[]>([])
  const [whiteboards, setWhiteboards] = useState<WhiteboardContent[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<'video' | 'document' | 'text' | 'whiteboard' | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (hasFetched.current) return
    
    if (isNewLesson) {
      // Update lesson data with module info when available
      if (lessonData) {
        const updatedModuleId = moduleInfo?.moduleId || urlModuleId || lessonData.moduleId
        const updatedOrder = moduleInfo?.lessonOrder || lessonData.order
        const updatedCourseId = courseId || lessonData.courseId
        
        if (updatedModuleId !== lessonData.moduleId || updatedOrder !== lessonData.order || updatedCourseId !== lessonData.courseId) {
          setLessonData({
            ...lessonData,
            moduleId: updatedModuleId,
            order: updatedOrder,
            courseId: updatedCourseId,
          })
        }
      }
      hasFetched.current = true
    } else if (lessonId && !isNewLesson) {
      hasFetched.current = true
      fetchLessonData()
    }
  }, [lessonId, isNewLesson, courseId, moduleInfo, urlModuleId])

  const fetchLessonData = async () => {
    if (!lessonId || isNewLesson) return
    try {
      setLoading(true)
      
      // Fetch lesson data and whiteboards in parallel for faster loading
      const [lesson, whiteboardsData] = await Promise.allSettled([
        LessonsAPI.getLesson(lessonId),
        courseId && lessonId ? WhiteboardsAPI.getCourseWhiteboards(courseId).catch(() => []).then(boards => 
          boards.filter((b: any) => b.lessonId === lessonId)
        ) : Promise.resolve([])
      ])
      
      // Set lesson data
      if (lesson.status === 'fulfilled') {
        const lessonValue = lesson.value as any
        // Ensure moduleId is set from content if not present
        if (!lessonValue.moduleId && lessonValue.content) {
          const content = lessonValue.content as any
          lessonValue.moduleId = content?.moduleId || ''
        }
        setLessonData(lessonValue)
      } else {
        throw lesson.reason
      }
      
      // Set whiteboards (non-blocking)
      if (whiteboardsData.status === 'fulfilled' && whiteboardsData.value) {
        setWhiteboards(whiteboardsData.value.map((w: any) => ({
          id: w.id,
          title: w.title,
          order: 0,
        })))
      }
      
      // Initialize empty arrays for other content types
      setVideos([])
      setDocuments([])
      setTextContent([])
      
    } catch (error: any) {
      console.error('Failed to fetch lesson:', error)
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to load lesson. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const [editingVideo, setEditingVideo] = useState<string | null>(null)
  const [videoEditData, setVideoEditData] = useState({ title: "", playbackUrl: "", thumbnailUrl: "" })
  
  const [editingDocument, setEditingDocument] = useState<string | null>(null)
  const [documentEditData, setDocumentEditData] = useState<{ title: string; fileUrl: string; fileType: 'pdf' | 'doc' | 'docx' | 'other' }>({ title: "", fileUrl: "", fileType: "pdf" })
  
  const [editingText, setEditingText] = useState<string | null>(null)
  const [textEditData, setTextEditData] = useState({ title: "", content: "" })
  
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [showAddText, setShowAddText] = useState(false)
  const [, setShowAddWhiteboard] = useState(false) // Used in handleAddWhiteboard

  const addVideo = () => {
    const newVideo: VideoContent = {
      id: `v${Date.now()}`,
      title: videoEditData.title || "New Video",
      playbackUrl: videoEditData.playbackUrl,
      thumbnailUrl: videoEditData.thumbnailUrl,
      duration: 0,
      order: videos.length + 1,
    }
    setVideos([...videos, newVideo])
    setVideoEditData({ title: "", playbackUrl: "", thumbnailUrl: "" })
    setShowAddVideo(false)
  }

  const saveVideo = (videoId: string) => {
    setVideos(videos.map(v =>
      v.id === videoId
        ? { ...v, title: videoEditData.title, playbackUrl: videoEditData.playbackUrl, thumbnailUrl: videoEditData.thumbnailUrl }
        : v
    ))
    setEditingVideo(null)
  }

  const deleteVideo = (videoId: string) => {
    setDeleteType('video')
    setItemToDelete(videoId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!deleteType || !itemToDelete) return

    if (deleteType === 'video') {
      setVideos(videos.filter(v => v.id !== itemToDelete))
    } else if (deleteType === 'document') {
      setDocuments(documents.filter(d => d.id !== itemToDelete))
    } else if (deleteType === 'text') {
      setTextContent(textContent.filter(t => t.id !== itemToDelete))
    } else if (deleteType === 'whiteboard') {
      setWhiteboards(whiteboards.filter(w => w.id !== itemToDelete))
    }

    setDeleteDialogOpen(false)
    setDeleteType(null)
    setItemToDelete(null)
  }

  const addDocument = () => {
    const newDoc: DocumentContent = {
      id: `d${Date.now()}`,
      title: documentEditData.title || "New Document",
      fileUrl: documentEditData.fileUrl,
      fileType: documentEditData.fileType,
      order: documents.length + 1,
    }
    setDocuments([...documents, newDoc])
    setDocumentEditData({ title: "", fileUrl: "", fileType: "pdf" as 'pdf' | 'doc' | 'docx' | 'other' })
    setShowAddDocument(false)
  }

  const saveDocument = (docId: string) => {
    setDocuments(documents.map(d =>
      d.id === docId
        ? { ...d, title: documentEditData.title, fileUrl: documentEditData.fileUrl, fileType: documentEditData.fileType }
        : d
    ))
    setEditingDocument(null)
  }

  const deleteDocument = (docId: string) => {
    setDeleteType('document')
    setItemToDelete(docId)
    setDeleteDialogOpen(true)
  }

  const addTextContent = () => {
    const newText: TextContent = {
      id: `t${Date.now()}`,
      title: textEditData.title || "New Notes",
      content: textEditData.content,
      order: textContent.length + 1,
    }
    setTextContent([...textContent, newText])
    setTextEditData({ title: "", content: "" })
    setShowAddText(false)
  }

  const saveText = (textId: string) => {
    setTextContent(textContent.map(t =>
      t.id === textId
        ? { ...t, title: textEditData.title, content: textEditData.content }
        : t
    ))
    setEditingText(null)
  }

  const deleteText = (textId: string) => {
    setDeleteType('text')
    setItemToDelete(textId)
    setDeleteDialogOpen(true)
  }

  const addWhiteboard = () => {
    const newWhiteboard: WhiteboardContent = {
      id: `w${Date.now()}`,
      title: "New Whiteboard",
      order: whiteboards.length + 1,
    }
    setWhiteboards([...whiteboards, newWhiteboard])
    setShowAddWhiteboard(false)
  }

  const deleteWhiteboard = (whiteboardId: string) => {
    setDeleteType('whiteboard')
    setItemToDelete(whiteboardId)
    setDeleteDialogOpen(true)
  }

  const startEditVideo = (video: VideoContent) => {
    setEditingVideo(video.id)
    setVideoEditData({ title: video.title, playbackUrl: video.playbackUrl, thumbnailUrl: video.thumbnailUrl || "" })
  }

  const startEditDocument = (doc: DocumentContent) => {
    setEditingDocument(doc.id)
    setDocumentEditData({ title: doc.title, fileUrl: doc.fileUrl, fileType: doc.fileType })
  }

  const startEditText = (text: TextContent) => {
    setEditingText(text.id)
    setTextEditData({ title: text.title, content: text.content })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const handleSaveLesson = async () => {
    if (!courseId) {
      toast.error("Course ID is missing")
      return
    }

    if (!lessonData) {
      toast.error("Lesson data is missing")
      return
    }

    // Validate title for new lessons
    if (isNewLesson && !lessonData.title.trim()) {
      toast.error("Please enter a lesson title")
      return
    }

    setSaving(true)
    try {
      let savedLessonId = lessonId

      // If this is a new lesson, create it first
      if (isNewLesson) {
        if (!moduleInfo?.moduleId) {
          toast.error("Module ID is missing. Please go back and try again.")
          setSaving(false)
          return
        }

        // Create the lesson
        const newLesson = await CoursesAPI.addLesson(courseId, moduleInfo.moduleId, {
          title: lessonData.title.trim() || 'New Lesson',
          description: lessonData.description || '',
          order: moduleInfo.lessonOrder || 1,
          duration: lessonData.duration || 10,
          isPreview: lessonData.isPreview || false,
        })

        savedLessonId = newLesson.id
        setLessonData(newLesson)
        
        // Update URL to use the real lesson ID and pass refresh flag
        navigate(`/courses/${courseId}/lessons/${savedLessonId}/edit`, { 
          replace: true,
          state: { lessonCreated: true }
        })
        
        toast.success("Lesson created successfully! You can now add content to your lesson.")
      }

      // Save videos
      for (const video of videos) {
        if (video.id.startsWith('v')) {
          // New video - would need to create via API
          // For now, just log (would need video upload API)
          console.log("Would save video:", video)
        }
      }

      // Save whiteboards (only if lesson is created)
      if (!isNewLesson && savedLessonId) {
        for (const whiteboard of whiteboards) {
          if (whiteboard.id.startsWith('w')) {
            try {
              await WhiteboardsAPI.createWhiteboard({
                courseId,
                lessonId: savedLessonId,
                title: whiteboard.title,
                content: {},
              })
            } catch (error: any) {
              console.error(`Failed to save whiteboard ${whiteboard.title}:`, error)
            }
          }
        }
      }

      // Update existing lesson if not new
      if (!isNewLesson && savedLessonId) {
        try {
          const updatedLesson = await LessonsAPI.updateLesson(savedLessonId, {
            title: lessonData.title.trim(),
            description: lessonData.description || '',
            order: lessonData.order,
            duration: lessonData.duration || 10,
            isPreview: lessonData.isPreview || false,
          })
          
          // Update local state with the updated lesson
          setLessonData(updatedLesson)
          toast.success("Lesson updated successfully!")
        } catch (error: any) {
          console.error("Failed to update lesson:", error)
          const errorMessage = error?.message || error?.response?.data?.error || error?.response?.data?.message || "Failed to update lesson. Please try again."
          toast.error(errorMessage)
        }
      } else if (!isNewLesson) {
        toast.success("Lesson content saved successfully!")
      }
    } catch (error: any) {
      console.error("Failed to save lesson:", error)
      const errorMessage = error?.message || error?.response?.data?.error || error?.response?.data?.message || "Failed to save lesson. Please try again."
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
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
                <BreadcrumbLink asChild>
                  <Link to={`/courses/${courseId}/builder`}>Course Builder</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Lesson Editor</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isNewLesson ? 'Create New Lesson' : (lessonData?.title || 'Loading...')}
              </h1>
              <p className="text-muted-foreground">
                {isNewLesson 
                  ? 'Fill in the lesson details below and add content to create your lesson'
                  : 'Edit lesson content and materials'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (courseId) {
                    navigate(`/courses/${courseId}/builder`, { state: { refresh: true } })
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Builder
              </Button>
              <Button onClick={handleSaveLesson} disabled={saving || !lessonData}>
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {isNewLesson ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isNewLesson ? 'Create Lesson' : 'Save Lesson'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Lesson Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Information</CardTitle>
              <CardDescription>
                {isNewLesson 
                  ? 'Enter the basic details for your new lesson'
                  : 'Basic details about this lesson'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lessonData || isNewLesson) ? (
                lessonData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                          value={lessonData.title || ''}
                          onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                          placeholder="Enter lesson title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (minutes)</label>
                        <Input
                          type="number"
                          value={lessonData.duration || 10}
                          onChange={(e) => setLessonData({ ...lessonData, duration: parseInt(e.target.value) || 10 })}
                          className="w-32"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={lessonData.description || ''}
                        onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                        rows={3}
                        placeholder="Describe what students will learn in this lesson"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPreview"
                        checked={lessonData.isPreview || false}
                        onChange={(e) => setLessonData({ ...lessonData, isPreview: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <label htmlFor="isPreview" className="text-sm font-medium">
                        Make this a preview lesson (free for students)
                      </label>
                    </div>
                    {isNewLesson && (
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Tip:</strong> After creating the lesson, you'll be able to add videos, documents, whiteboards, and other content.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Initializing lesson editor...
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? 'Loading lesson data...' : 'No lesson data available'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Videos Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Videos
                    </CardTitle>
                    <CardDescription>
                      Add video content to your lesson
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowAddVideo(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Video
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddVideo && (
                  <Card className="mb-4 border-2">
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Video Title"
                        value={videoEditData.title}
                        onChange={(e) => setVideoEditData({ ...videoEditData, title: e.target.value })}
                      />
                      <Input
                        placeholder="Video URL"
                        value={videoEditData.playbackUrl}
                        onChange={(e) => setVideoEditData({ ...videoEditData, playbackUrl: e.target.value })}
                      />
                      <Input
                        placeholder="Thumbnail URL (optional)"
                        value={videoEditData.thumbnailUrl}
                        onChange={(e) => setVideoEditData({ ...videoEditData, thumbnailUrl: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addVideo}>
                          <Save className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddVideo(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {videos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No videos added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videos.map((video) => (
                      <Card key={video.id} className="border">
                        <CardContent className="p-4">
                          {editingVideo === video.id ? (
                            <div className="space-y-3">
                              <Input
                                value={videoEditData.title}
                                onChange={(e) => setVideoEditData({ ...videoEditData, title: e.target.value })}
                              />
                              <Input
                                value={videoEditData.playbackUrl}
                                onChange={(e) => setVideoEditData({ ...videoEditData, playbackUrl: e.target.value })}
                              />
                              <Input
                                value={videoEditData.thumbnailUrl}
                                onChange={(e) => setVideoEditData({ ...videoEditData, thumbnailUrl: e.target.value })}
                                placeholder="Thumbnail URL"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveVideo(video.id)}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingVideo(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-24 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                                  <Video className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{video.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(video.duration)}
                                  </span>
                                  <span className="truncate">{video.playbackUrl}</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <GripVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditVideo(video)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteVideo(video.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <File className="h-5 w-5" />
                      Documents & PDFs
                    </CardTitle>
                    <CardDescription>
                      Add downloadable resources
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowAddDocument(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddDocument && (
                  <Card className="mb-4 border-2">
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Document Title"
                        value={documentEditData.title}
                        onChange={(e) => setDocumentEditData({ ...documentEditData, title: e.target.value })}
                      />
                      <Input
                        placeholder="File URL"
                        value={documentEditData.fileUrl}
                        onChange={(e) => setDocumentEditData({ ...documentEditData, fileUrl: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload File
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Link URL
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addDocument}>
                          <Save className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddDocument(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No documents added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border">
                        <CardContent className="p-4">
                          {editingDocument === doc.id ? (
                            <div className="space-y-3">
                              <Input
                                value={documentEditData.title}
                                onChange={(e) => setDocumentEditData({ ...documentEditData, title: e.target.value })}
                              />
                              <Input
                                value={documentEditData.fileUrl}
                                onChange={(e) => setDocumentEditData({ ...documentEditData, fileUrl: e.target.value })}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveDocument(doc.id)}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingDocument(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                {getFileTypeIcon(doc.fileType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{doc.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {doc.fileType.toUpperCase()}
                                  </Badge>
                                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <GripVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditDocument(doc)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteDocument(doc.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text/Notes Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Notes & Text Content
                    </CardTitle>
                    <CardDescription>
                      Add written content and notes
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowAddText(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Notes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddText && (
                  <Card className="mb-4 border-2">
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Content Title"
                        value={textEditData.title}
                        onChange={(e) => setTextEditData({ ...textEditData, title: e.target.value })}
                      />
                      <textarea
                        placeholder="Write your content here..."
                        value={textEditData.content}
                        onChange={(e) => setTextEditData({ ...textEditData, content: e.target.value })}
                        rows={6}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addTextContent}>
                          <Save className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddText(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {textContent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No text content added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {textContent.map((text) => (
                      <Card key={text.id} className="border">
                        <CardContent className="p-4">
                          {editingText === text.id ? (
                            <div className="space-y-3">
                              <Input
                                value={textEditData.title}
                                onChange={(e) => setTextEditData({ ...textEditData, title: e.target.value })}
                              />
                              <textarea
                                value={textEditData.content}
                                onChange={(e) => setTextEditData({ ...textEditData, content: e.target.value })}
                                rows={6}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveText(text.id)}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingText(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium">{text.title}</h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <GripVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditText(text)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteText(text.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {text.content}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Whiteboards Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Whiteboards
                    </CardTitle>
                    <CardDescription>
                      Interactive whiteboards for lessons
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={addWhiteboard}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Whiteboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {whiteboards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No whiteboards added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {whiteboards.map((whiteboard) => (
                      <Card key={whiteboard.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <PenTool className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">{whiteboard.title}</h4>
                                <p className="text-xs text-muted-foreground">Interactive whiteboard</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <GripVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  navigate(`/courses/${courseId}/lessons/${lessonId}/whiteboard/${whiteboard.id}`)
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Whiteboard
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteWhiteboard(whiteboard.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Content Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Videos</p>
                    <p className="text-2xl font-bold">{videos.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Text Content</p>
                    <p className="text-2xl font-bold">{textContent.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Whiteboards</p>
                    <p className="text-2xl font-bold">{whiteboards.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteType === 'video' ? 'Video' : deleteType === 'document' ? 'Document' : deleteType === 'text' ? 'Content' : 'Whiteboard'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteType === 'video' ? 'video' : deleteType === 'document' ? 'document' : deleteType === 'text' ? 'content' : 'whiteboard'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}

