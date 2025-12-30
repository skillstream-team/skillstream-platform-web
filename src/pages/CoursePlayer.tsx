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
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Video,
  FileText,
  HelpCircle,
  Menu,
  X,
  MessageSquare,
  Pin,
  Lock,
  Send,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  FileQuestion,
  AlertCircle,
  Award,
  CheckCircle,
  XCircle,
  RadioButton,
  ListChecks,
  Gauge,
  Subtitles,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Flame,
  Trophy,
  Zap
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom"
import { CoursesAPI } from "@/api/courses.api"
import { ProgressAPI } from "@/api/progress.api"
import { VideoFeaturesAPI } from "@/api/video-features.api"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ForumsAPI, ForumPost, ForumReply } from "@/api/forums.api"
import { Course, Module, Lesson, Quiz } from "@/api/types"
import { QuizzesAPI, QuizQuestion, QuizAttempt } from "@/api/quizzes.api"
import { InstructorQAAPI, Question } from "@/api/instructor-qa.api"
import { AnnouncementsAPI, Announcement } from "@/api/announcements.api"
import { CertificatesAPI } from "@/api/certificates.api"
import { PollsAPI, Poll } from "@/api/polls.api"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface CourseWithStructure extends Course {
  modules?: (Module & {
    lessons?: (Lesson & {
      quizzes?: Quiz[]
      progress?: {
        completionPercentage: number
        status: 'not-started' | 'in-progress' | 'completed'
      }
    })[]
    progress?: {
      completionPercentage: number
      status: 'not-started' | 'in-progress' | 'completed'
    }
  })[]
}

interface VideoContent {
  id: string
  title: string
  playbackUrl: string
  thumbnailUrl?: string
  duration: number
}

export function CoursePlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const { settings } = useSystemSettings()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseWithStructure | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [videoProgress, setVideoProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'lesson' | 'discussions' | 'notes' | 'quiz' | 'qa' | 'announcements' | 'polls'>('lesson')
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [forumLoading, setForumLoading] = useState(false)
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [submittingPost, setSubmittingPost] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [replyingToPost, setReplyingToPost] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [notes, setNotes] = useState<Array<{ id: string; timestamp: number; content: string; createdAt: string }>>([])
  const [bookmarks, setBookmarks] = useState<Array<{ id: string; timestamp: number; createdAt: string }>>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [currentAttempt, setCurrentAttempt] = useState<Record<string, any>>({})
  const [quizLoading, setQuizLoading] = useState(false)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null)
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [qaLoading, setQaLoading] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollsLoading, setPollsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasFetched = useRef(false)
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Video player enhancements
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [subtitles, setSubtitles] = useState<any[]>([])
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [videoQualities, setVideoQualities] = useState<string[]>([])
  const [selectedQuality, setSelectedQuality] = useState<string>('auto')
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completedCourse, setCompletedCourse] = useState<any>(null)
  const [transcriptText, setTranscriptText] = useState<string>('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>('')

  useEffect(() => {
    if (hasFetched.current || !courseId) return
    hasFetched.current = true
    fetchCourseData()
    fetchForumPosts()
  }, [courseId, isPreview])

  useEffect(() => {
    if (activeTab === 'discussions' && courseId) {
      fetchForumPosts()
    }
  }, [activeTab, courseId])

  useEffect(() => {
    if (lessonId && course?.modules) {
      // Find the lesson in the course structure
      for (const module of course.modules) {
        const lesson = module.lessons?.find(l => l.id === lessonId)
        if (lesson) {
          setSelectedLesson(lesson)
          fetchLessonContent(lesson)
          // Expand the module containing this lesson
          setExpandedModules(prev => new Set(prev).add(module.id))
          break
        }
      }
    } else if (course?.modules && course.modules.length > 0) {
      // Select first lesson if no lesson selected
      const firstModule = course.modules[0]
      const firstLesson = firstModule.lessons?.[0]
      if (firstLesson) {
        setSelectedLesson(firstLesson)
        fetchLessonContent(firstLesson)
        setExpandedModules(prev => new Set(prev).add(firstModule.id))
      }
    }
  }, [lessonId, course])

  const fetchCourseData = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const courseData = await CoursesAPI.getCourse(courseId)
      
      // TODO: Fetch modules and lessons - this would need API endpoints
      // For now, we'll use the course data structure if it includes modules
      setCourse(courseData as CourseWithStructure)
      
      // Check enrollment status (skip if preview mode)
      if (!isPreview) {
        try {
          const enrollments = await EnrollmentsAPI.getEnrollments({ courseId })
          const userEnrollment = enrollments.enrollments?.find(
            (e: any) => e.studentId === currentUser?.id
          )
          setIsEnrolled(!!userEnrollment)
          
          if (!userEnrollment && lessonId) {
            // Check if trying to access non-preview lesson
            const currentLesson = courseData.modules?.flatMap(m => m.lessons || [])
              .find(l => l.id === lessonId)
            if (currentLesson && !currentLesson.isPreview) {
              toast.error('Please enroll in this course to access all lessons')
              navigate(`/courses/${courseId}`)
              return
            }
          }
          
          // Fetch progress for course
          if (userEnrollment) {
            const progress = await ProgressAPI.getCourseProgress(courseId, currentUser?.id)
            // Progress would be merged with course data
          }
        } catch (error) {
          // Progress might not exist yet or enrollment check failed
          setIsEnrolled(false)
        }
      } else {
        // Preview mode - allow access to preview lessons only
        setIsEnrolled(false)
      }
    } catch (error: any) {
      console.error('Failed to fetch course:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const fetchLessonContent = async (lesson: Lesson) => {
    try {
      // Fetch videos for this lesson
      const videosResponse = await VideoFeaturesAPI.getVideos({
        courseId: courseId,
        lessonId: lesson.id,
      })
      const videos = videosResponse.videos || []
      if (videos.length > 0) {
        const video = videos[0]
        setVideoContent({
          id: video.id,
          title: video.title,
          playbackUrl: video.playbackUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
        })
        
        // Fetch subtitles
        try {
          const subtitlesData = await VideoFeaturesAPI.getSubtitles(video.id)
          setSubtitles(subtitlesData || [])
          if (subtitlesData && subtitlesData.length > 0) {
            setSelectedSubtitle(subtitlesData[0].language)
            setShowSubtitles(true)
            
            // Fetch transcript text if available
            try {
              const transcript = subtitlesData.find((s: any) => s.format === 'vtt' || s.format === 'srt')
              if (transcript?.url) {
                setTranscriptLoading(true)
                const response = await fetch(transcript.url)
                const text = await response.text()
                // Parse VTT/SRT to plain text (simplified)
                const parsedText = text
                  .replace(/WEBVTT|^\d+$/gm, '')
                  .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}$/gm, '')
                  .replace(/^\d+$/gm, '')
                  .replace(/^<[^>]+>$/gm, '')
                  .trim()
                setTranscriptText(parsedText)
              }
            } catch (error) {
              console.error('Failed to fetch transcript:', error)
            } finally {
              setTranscriptLoading(false)
            }
          }
        } catch (error) {
          console.error('Failed to fetch subtitles:', error)
        }
        
        // Set video qualities if available
        if (video.quality && video.quality.length > 0) {
          setVideoQualities(['auto', ...video.quality])
        }
        
        // Load video progress
        try {
          const progress = await VideoFeaturesAPI.getVideoProgress(video.id)
          if (progress.currentTime && videoRef.current) {
            videoRef.current.currentTime = progress.currentTime
          }
        } catch (error) {
          // No progress yet
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch lesson content:', error)
    }
  }
  
  // Video player controls
  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }
  
  const handleSubtitleChange = (language: string | null) => {
    setSelectedSubtitle(language)
    setShowSubtitles(!!language)
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = tracks[i].language === language ? 'showing' : 'hidden'
      }
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      // Only handle if not typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (videoRef.current.paused) {
            videoRef.current.play()
          } else {
            videoRef.current.pause()
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (videoRef.current.volume < 1) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (videoRef.current.volume > 0) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1)
          }
          break
        case 'm':
        case 'M':
          e.preventDefault()
          videoRef.current.muted = !videoRef.current.muted
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleLessonClick = (lesson: Lesson) => {
    // Check if user can access this lesson
    if (!isEnrolled && !lesson.isPreview && !isPreview) {
      toast.error('Please enroll in this course to access all lessons')
      navigate(`/courses/${courseId}`)
      return
    }
    
    setSelectedLesson(lesson)
    fetchLessonContent(lesson)
    const previewParam = isPreview ? '?preview=true' : ''
    navigate(`/courses/${courseId}/learn/${lesson.id}${previewParam}`)
  }

  const handleVideoProgress = () => {
    if (videoRef.current && videoContent) {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      if (duration > 0) {
        const progress = (currentTime / duration) * 100
        setVideoProgress(progress)
        
        // Update progress on server (debounced)
        // In production, this would be debounced to avoid too many API calls
      }
    }
  }

  const fetchForumPosts = async () => {
    if (!courseId) return
    try {
      setForumLoading(true)
      const response = await ForumsAPI.getPosts(courseId, { limit: 50 })
      setForumPosts(response.posts || [])
    } catch (error: any) {
      console.error('Failed to fetch forum posts:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load discussions')
      }
    } finally {
      setForumLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!courseId || !newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please fill in both title and content')
      return
    }
    
    try {
      setSubmittingPost(true)
      await ForumsAPI.createPost({
        courseId,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      })
      toast.success('Post created successfully')
      setNewPostTitle('')
      setNewPostContent('')
      setShowNewPostForm(false)
      await fetchForumPosts()
    } catch (error: any) {
      console.error('Failed to create post:', error)
      toast.error(error?.response?.data?.message || 'Failed to create post')
    } finally {
      setSubmittingPost(false)
    }
  }

  const handleReply = async (postId: string) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply')
      return
    }
    
    try {
      setSubmittingReply(true)
      await ForumsAPI.createReply({
        postId,
        content: replyContent.trim(),
      })
      toast.success('Reply posted successfully')
      setReplyContent('')
      setReplyingToPost(null)
      await fetchForumPosts()
      // Refresh selected post if it's the one we replied to
      if (selectedPost?.id === postId) {
        const response = await ForumsAPI.getPost(postId)
        setSelectedPost(response)
      }
    } catch (error: any) {
      console.error('Failed to create reply:', error)
      toast.error(error?.response?.data?.message || 'Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await ForumsAPI.deletePost(postId)
      toast.success('Post deleted successfully')
      if (selectedPost?.id === postId) {
        setSelectedPost(null)
      }
      await fetchForumPosts()
    } catch (error: any) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post')
    }
  }

  // Notes & Bookmarks functionality
  const getStorageKey = () => {
    if (!courseId || !selectedLesson?.id) return null
    return `notes_bookmarks_${courseId}_${selectedLesson.id}_${currentUser?.id}`
  }

  const loadNotesAndBookmarks = () => {
    const key = getStorageKey()
    if (!key) return
    
    try {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)
        setNotes(parsed.notes || [])
        setBookmarks(parsed.bookmarks || [])
      } else {
        setNotes([])
        setBookmarks([])
      }
    } catch (error) {
      console.error('Failed to load notes/bookmarks:', error)
      setNotes([])
      setBookmarks([])
    }
  }

  const saveNotesAndBookmarks = () => {
    const key = getStorageKey()
    if (!key) return
    
    try {
      localStorage.setItem(key, JSON.stringify({
        notes,
        bookmarks,
      }))
    } catch (error) {
      console.error('Failed to save notes/bookmarks:', error)
    }
  }

  useEffect(() => {
    saveNotesAndBookmarks()
  }, [notes, bookmarks])

  const formatTimestamp = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAddNote = () => {
    if (!videoRef.current || !newNoteContent.trim()) return
    
    const timestamp = videoRef.current.currentTime
    const newNote = {
      id: Date.now().toString(),
      timestamp,
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    }
    
    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp))
    setNewNoteContent('')
    setIsAddingNote(false)
    toast.success('Note added successfully')
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    toast.success('Note deleted')
  }

  const handleAddBookmark = () => {
    if (!videoRef.current) return
    
    const timestamp = videoRef.current.currentTime
    const isBookmarked = bookmarks.some(b => Math.abs(b.timestamp - timestamp) < 1)
    
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => Math.abs(b.timestamp - timestamp) >= 1))
      toast.success('Bookmark removed')
    } else {
      const newBookmark = {
        id: Date.now().toString(),
        timestamp,
        createdAt: new Date().toISOString(),
      }
      setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.timestamp - b.timestamp))
      toast.success('Bookmark added')
    }
  }

  const handleJumpToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.play()
    }
  }

  const isCurrentTimestampBookmarked = () => {
    if (!videoRef.current) return false
    const currentTime = videoRef.current.currentTime
    return bookmarks.some(b => Math.abs(b.timestamp - currentTime) < 1)
  }
  
  // Export notes as text/markdown
  const exportNotes = () => {
    if (notes.length === 0) {
      toast.error('No notes to export')
      return
    }
    
    let content = `# Notes for ${selectedLesson?.title || 'Lesson'}\n\n`
    content += `Course: ${course?.title || 'Unknown'}\n`
    content += `Exported: ${new Date().toLocaleString()}\n\n`
    content += '---\n\n'
    
    notes.forEach((note, index) => {
      const timestamp = formatTimestamp(note.timestamp)
      content += `## Note ${index + 1} - ${timestamp}\n\n`
      content += `${note.content}\n\n`
      content += '---\n\n'
    })
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${course?.title || 'course'}-notes-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Notes exported successfully!')
  }
  
  // Share certificate
  const handleShareCertificate = async (certificateId: string, courseTitle: string) => {
    const url = `${window.location.origin}/certificates/${certificateId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Certificate link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  // Quiz functionality
  const fetchQuiz = async () => {
    if (!selectedLesson?.id || !courseId) {
      setQuiz(null)
      setQuizQuestions([])
      setQuizAttempts([])
      return
    }
    try {
      setQuizLoading(true)
      // Check if lesson has quiz data in the course structure
      if (selectedLesson.quizzes && selectedLesson.quizzes.length > 0 && selectedLesson.quizzes[0].id) {
        const quizId = selectedLesson.quizzes[0].id
        await fetchQuizData(quizId)
      } else {
        setQuiz(null)
        setQuizQuestions([])
        setQuizAttempts([])
        setSelectedAttempt(null)
        setCurrentAttempt({})
        setQuizTimeRemaining(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch quiz:', error)
      setQuiz(null)
      setQuizQuestions([])
      setQuizAttempts([])
    } finally {
      setQuizLoading(false)
    }
  }

  const fetchQuizData = async (quizId: string) => {
    try {
      setQuizLoading(true)
      const [quizData, questionsData, attemptsData] = await Promise.all([
        QuizzesAPI.getQuiz(quizId),
        QuizzesAPI.getQuizQuestions(quizId),
        QuizzesAPI.getQuizAttempts(quizId, currentUser?.id).catch(() => [])
      ])
      setQuiz(quizData)
      setQuizQuestions(questionsData.sort((a, b) => a.order - b.order))
      setQuizAttempts(attemptsData)
      
      // Start timer if time limit exists
      if (quizData.timeLimit) {
        setQuizTimeRemaining(quizData.timeLimit * 60) // Convert minutes to seconds
      }
    } catch (error: any) {
      console.error('Failed to fetch quiz data:', error)
      toast.error('Failed to load quiz')
    } finally {
      setQuizLoading(false)
    }
  }

  useEffect(() => {
    if (quizTimeRemaining !== null && quizTimeRemaining > 0) {
      quizTimerRef.current = setInterval(() => {
        setQuizTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (prev === 1 && quiz) {
              handleSubmitQuiz()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (quizTimerRef.current) {
          clearInterval(quizTimerRef.current)
        }
      }
    }
  }, [quizTimeRemaining, quiz])

  const handleSubmitQuiz = async () => {
    if (!quiz || submittingQuiz) return
    
    try {
      setSubmittingQuiz(true)
      const attempt = await QuizzesAPI.submitQuizAttempt(quiz.id, currentAttempt)
      toast.success('Quiz submitted successfully')
      
      // Refresh attempts
      const attempts = await QuizzesAPI.getQuizAttempts(quiz.id, currentUser?.id)
      setQuizAttempts(attempts)
      
      // Show results
      setSelectedAttempt(attempt)
      setCurrentAttempt({})
      
      // Clear timer
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current)
      }
      setQuizTimeRemaining(null)
    } catch (error: any) {
      console.error('Failed to submit quiz:', error)
      toast.error(error?.response?.data?.message || 'Failed to submit quiz')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  // Q&A functionality
  const fetchQuestions = async () => {
    if (!courseId) return
    try {
      setQaLoading(true)
      const response = await InstructorQAAPI.getQuestions(courseId, { limit: 50 })
      setQuestions(response.questions || [])
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load questions')
      }
    } finally {
      setQaLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!courseId || !newQuestion.trim()) {
      toast.error('Please enter a question')
      return
    }
    
    try {
      setSubmittingQuestion(true)
      await InstructorQAAPI.askQuestion(courseId, {
        courseId,
        question: newQuestion.trim(),
      })
      toast.success('Question submitted successfully')
      setNewQuestion('')
      setShowQuestionForm(false)
      await fetchQuestions()
    } catch (error: any) {
      console.error('Failed to ask question:', error)
      toast.error(error?.response?.data?.message || 'Failed to submit question')
    } finally {
      setSubmittingQuestion(false)
    }
  }

  // Announcements functionality
  const fetchAnnouncements = async () => {
    if (!courseId) return
    try {
      setAnnouncementsLoading(true)
      const response = await AnnouncementsAPI.getAnnouncements(courseId, { limit: 50 })
      setAnnouncements(response.announcements || [])
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load announcements')
      }
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  // Polls functionality
  const fetchPolls = async () => {
    if (!courseId) return
    try {
      setPollsLoading(true)
      const response = await PollsAPI.getPolls(courseId, { limit: 50, isActive: true })
      setPolls(response.polls || [])
    } catch (error: any) {
      console.error('Failed to fetch polls:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load polls')
      }
    } finally {
      setPollsLoading(false)
    }
  }

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      await PollsAPI.vote(pollId, { optionIds })
      toast.success('Vote submitted successfully')
      await fetchPolls()
    } catch (error: any) {
      console.error('Failed to vote:', error)
      toast.error(error?.response?.data?.message || 'Failed to submit vote')
    }
  }

  const handleVideoEnd = async () => {
    if (selectedLesson && courseId) {
      // Mark lesson as complete
      try {
        await ProgressAPI.markAsComplete({
          courseId,
          lessonId: selectedLesson.id,
        })
        toast.success('Lesson completed!')
        
        // Check if course is completed and generate certificate
        try {
          const progress = await ProgressAPI.getCourseProgress(courseId, currentUser?.id)
          if (progress && progress.status === 'completed' && progress.completionPercentage === 100) {
            // Check if certificate already exists
            try {
              const certificates = await CertificatesAPI.getCertificates({ courseId })
              const existingCert = Array.isArray(certificates) 
                ? certificates.find((c: any) => c.courseId === courseId)
                : null
              
              if (!existingCert) {
                // Generate certificate
                const cert = await CertificatesAPI.generateCertificate(courseId)
                setCompletedCourse(course)
                setShowCompletionDialog(true)
              }
            } catch (certError) {
              // Certificate might already exist or generation failed
              console.error('Certificate check/generation failed:', certError)
            }
          }
        } catch (progressError) {
          console.error('Failed to check course progress:', progressError)
        }
        
        // Refresh course data to update progress
        fetchCourseData()
      } catch (error: any) {
        console.error('Failed to mark lesson as complete:', error)
      }
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

  const getNextLesson = (): Lesson | null => {
    if (!course?.modules || !selectedLesson) return null
    
    let foundCurrent = false
    for (const module of course.modules) {
      if (!module.lessons) continue
      for (let i = 0; i < module.lessons.length; i++) {
        if (module.lessons[i].id === selectedLesson.id) {
          foundCurrent = true
          // Check if there's a next lesson in this module
          if (i < module.lessons.length - 1) {
            return module.lessons[i + 1]
          }
          // Check next module
          const moduleIndex = course.modules.indexOf(module)
          if (moduleIndex < course.modules.length - 1) {
            const nextModule = course.modules[moduleIndex + 1]
            if (nextModule.lessons && nextModule.lessons.length > 0) {
              return nextModule.lessons[0]
            }
          }
        }
      }
    }
    return null
  }

  const getPrevLesson = (): Lesson | null => {
    if (!course?.modules || !selectedLesson) return null
    
    for (const module of course.modules) {
      if (!module.lessons) continue
      for (let i = 0; i < module.lessons.length; i++) {
        if (module.lessons[i].id === selectedLesson.id) {
          // Check if there's a previous lesson in this module
          if (i > 0) {
            return module.lessons[i - 1]
          }
          // Check previous module
          const moduleIndex = course.modules.indexOf(module)
          if (moduleIndex > 0) {
            const prevModule = course.modules[moduleIndex - 1]
            if (prevModule.lessons && prevModule.lessons.length > 0) {
              return prevModule.lessons[prevModule.lessons.length - 1]
            }
          }
        }
      }
    }
    return null
  }

  const handleNext = () => {
    const next = getNextLesson()
    if (next) {
      handleLessonClick(next)
    }
  }

  const handlePrev = () => {
    const prev = getPrevLesson()
    if (prev) {
      handleLessonClick(prev)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen">
            <Skeleton className="w-64" />
            <div className="flex-1 p-6">
              <Skeleton className="h-96 w-full" />
            </div>
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
          <Card className="m-6 text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">Course not found</h3>
              <Button onClick={() => navigate('/my-courses')}>
                Back to My Courses
              </Button>
            </CardContent>
          </Card>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0
  const completedLessons = course.modules?.reduce((sum, m) => 
    sum + (m.lessons?.filter(l => l.progress?.status === 'completed').length || 0), 0
  ) || 0
  const courseProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/my-courses">My Courses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {course.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="text-sm text-muted-foreground">
            {completedLessons} / {totalLessons} lessons
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)]">
          {/* Course Sidebar */}
          {(sidebarOpen || window.innerWidth >= 768) && (
            <div className={`w-64 border-r bg-muted/20 overflow-y-auto ${sidebarOpen ? '' : 'hidden md:block'}`}>
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="font-semibold mb-2 line-clamp-2">{course.title}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(courseProgress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all rounded-full"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  {course.modules?.map((module, moduleIndex) => (
                    <Collapsible
                      key={module.id}
                      open={expandedModules.has(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                              {moduleIndex + 1}
                            </div>
                            <span className="text-sm font-medium truncate">{module.title}</span>
                          </div>
                          {expandedModules.has(module.id) ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-8 mt-1 space-y-1">
                          {module.lessons?.map((lesson) => {
                            const canAccess = isEnrolled || lesson.isPreview || isPreview
                            return (
                              <div key={lesson.id} className="space-y-1">
                                <div
                                  onClick={() => handleLessonClick(lesson)}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                    canAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                  } ${
                                    selectedLesson?.id === lesson.id
                                      ? 'bg-primary text-primary-foreground'
                                      : canAccess ? 'hover:bg-muted' : ''
                                  }`}
                                >
                                  <Video className="h-4 w-4 flex-shrink-0" />
                                  <span className="flex-1 truncate">{lesson.title}</span>
                                  {lesson.progress?.status === 'completed' && (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  {lesson.isPreview && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                                      Preview
                                    </Badge>
                                  )}
                                  {!canAccess && !lesson.isPreview && (
                                    <Lock className="h-4 w-4 flex-shrink-0" />
                                  )}
                                </div>
                                {lesson.quizzes && lesson.quizzes.length > 0 && canAccess && (
                                  <div
                                    onClick={() => {
                                      setSelectedLesson(lesson)
                                      setActiveTab('quiz')
                                    }}
                                    className={`ml-6 flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${
                                      activeTab === 'quiz' && selectedLesson?.id === lesson.id
                                        ? 'bg-primary/20 text-primary'
                                        : 'hover:bg-muted/50 text-muted-foreground'
                                    }`}
                                  >
                                    <FileQuestion className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="flex-1 truncate">{lesson.quizzes[0].title}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview Mode Banner */}
            {isPreview && !isEnrolled && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Preview Mode</p>
                      <p className="text-sm text-blue-700">You're viewing preview content. Enroll to access all lessons.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/courses/${courseId}`)}
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            )}
            {selectedLesson ? (
              <>
                {/* Lesson Header */}
                <div className="border-b p-4 bg-background">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'lesson' | 'discussions' | 'notes' | 'quiz' | 'qa' | 'announcements' | 'polls' | 'transcript')}>
                    <TabsList className="mb-4 flex-wrap">
                      <TabsTrigger value="lesson">
                        <Video className="h-4 w-4 mr-2" />
                        Lesson
                      </TabsTrigger>
                      {transcriptText && (
                        <TabsTrigger value="transcript">
                          <FileText className="h-4 w-4 mr-2" />
                          Transcript
                        </TabsTrigger>
                      )}
                      {quiz && (
                        <TabsTrigger value="quiz">
                          <FileQuestion className="h-4 w-4 mr-2" />
                          Quiz
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="qa">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Q&A
                      </TabsTrigger>
                      <TabsTrigger value="announcements">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Announcements
                      </TabsTrigger>
                      <TabsTrigger value="polls">
                        <ListChecks className="h-4 w-4 mr-2" />
                        Polls
                      </TabsTrigger>
                      {settings?.enableForums !== false && (
                        <TabsTrigger value="discussions">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Discussions
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="notes">
                        <StickyNote className="h-4 w-4 mr-2" />
                        Notes
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lesson" className="mt-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h1 className="text-2xl font-bold mb-2">{selectedLesson.title}</h1>
                          {selectedLesson.description && (
                            <p className="text-muted-foreground">{selectedLesson.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {selectedLesson.duration} min
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Content Area */}
                {activeTab === 'lesson' ? (
                  <>
                    {/* Video Player */}
                    <div className="flex-1 overflow-auto bg-black">
                  {videoContent ? (
                    <div className="max-w-5xl mx-auto p-4">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={videoContent.playbackUrl}
                          className="w-full h-full"
                          controls
                          onTimeUpdate={handleVideoProgress}
                          onEnded={handleVideoEnd}
                        >
                          {subtitles.map((subtitle) => (
                            <track
                              key={subtitle.id}
                              kind="subtitles"
                              srcLang={subtitle.language}
                              label={subtitle.language}
                              src={subtitle.url}
                              default={selectedSubtitle === subtitle.language}
                            />
                          ))}
                          Your browser does not support the video tag.
                        </video>
                        {/* Video Controls Overlay */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          {/* Speed Control */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                title="Playback Speed"
                              >
                                <Gauge className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                <DropdownMenuItem
                                  key={speed}
                                  onClick={() => handlePlaybackSpeedChange(speed)}
                                  className={playbackSpeed === speed ? "bg-accent" : ""}
                                >
                                  {speed}x {speed === 1 && "(Normal)"}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Subtitle Control */}
                          {subtitles.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                  title="Subtitles"
                                >
                                  <Subtitles className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSubtitleChange(null)}>
                                  Off
                                </DropdownMenuItem>
                                {subtitles.map((subtitle) => (
                                  <DropdownMenuItem
                                    key={subtitle.id}
                                    onClick={() => handleSubtitleChange(subtitle.language)}
                                    className={selectedSubtitle === subtitle.language ? "bg-accent" : ""}
                                  >
                                    {subtitle.language}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          
                          {/* Bookmark Button */}
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleAddBookmark}
                            className={`bg-black/50 hover:bg-black/70 text-white border-white/20 ${isCurrentTimestampBookmarked() ? "bg-yellow-500/80 hover:bg-yellow-600/80" : ""}`}
                            title="Bookmark"
                          >
                            {isCurrentTimestampBookmarked() ? (
                              <BookmarkCheck className="h-5 w-5" />
                            ) : (
                              <Bookmark className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {/* Video Controls Bar */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/70">Speed:</span>
                          <Select value={playbackSpeed.toString()} onValueChange={(val) => handlePlaybackSpeedChange(parseFloat(val))}>
                            <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.5">0.5x</SelectItem>
                              <SelectItem value="0.75">0.75x</SelectItem>
                              <SelectItem value="1">1x</SelectItem>
                              <SelectItem value="1.25">1.25x</SelectItem>
                              <SelectItem value="1.5">1.5x</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {subtitles.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">Subtitles:</span>
                            <Select value={selectedSubtitle || 'off'} onValueChange={(val) => handleSubtitleChange(val === 'off' ? null : val)}>
                              <SelectTrigger className="w-32 h-8 bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="off">Off</SelectItem>
                                {subtitles.map((subtitle) => (
                                  <SelectItem key={subtitle.id} value={subtitle.language}>
                                    {subtitle.language}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {videoQualities.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">Quality:</span>
                            <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                              <SelectTrigger className="w-24 h-8 bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {videoQualities.map((quality) => (
                                  <SelectItem key={quality} value={quality}>
                                    {quality}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="text-white/50 text-xs ml-auto">
                          Press Space to play/pause, Arrow keys to seek
                        </div>
                      </div>
                      {/* Add Note Button */}
                      <div className="mt-4 flex gap-2">
                        {!isAddingNote ? (
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingNote(true)}
                            className="text-white border-white/20 hover:bg-white/10"
                          >
                            <StickyNote className="h-4 w-4 mr-2" />
                            Add Note at Current Time
                          </Button>
                        ) : (
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              placeholder="Type your note here..."
                              value={newNoteContent}
                              onChange={(e) => setNewNoteContent(e.target.value)}
                              className="text-white bg-white/10 border-white/20 placeholder:text-white/50"
                              rows={2}
                            />
                            <Button
                              onClick={handleAddNote}
                              disabled={!newNoteContent.trim()}
                              className="text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddingNote(false)
                                setNewNoteContent('')
                              }}
                              className="text-white border-white/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-white">
                        <h2 className="text-xl font-semibold mb-2">{videoContent.title}</h2>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No video content available for this lesson</p>
                      </div>
                    </div>
                  )}
                </div>

                    {/* Navigation Footer */}
                    <div className="border-t p-4 bg-background">
                      <div className="flex items-center justify-between max-w-5xl mx-auto">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          disabled={!getPrevLesson()}
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={handleNext}
                          disabled={!getNextLesson()}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : activeTab === 'discussions' ? (
                  /* Discussions Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      {/* New Post Button */}
                      <div className="mb-6">
                        {!showNewPostForm ? (
                          <Button onClick={() => setShowNewPostForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                          </Button>
                        ) : (
                          <Card className="mb-4">
                            <CardHeader>
                              <CardTitle>Create New Post</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Input
                                  placeholder="Post title..."
                                  value={newPostTitle}
                                  onChange={(e) => setNewPostTitle(e.target.value)}
                                />
                              </div>
                              <div>
                                <Textarea
                                  placeholder="What would you like to discuss?"
                                  value={newPostContent}
                                  onChange={(e) => setNewPostContent(e.target.value)}
                                  rows={6}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleCreatePost}
                                  disabled={submittingPost || !newPostTitle.trim() || !newPostContent.trim()}
                                >
                                  {submittingPost ? 'Posting...' : 'Post'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowNewPostForm(false)
                                    setNewPostTitle('')
                                    setNewPostContent('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Posts List */}
                      {forumLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : forumPosts.length > 0 ? (
                        <div className="space-y-4">
                          {forumPosts.map((post) => (
                            <Card
                              key={post.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedPost(post)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {post.isPinned && (
                                        <Pin className="h-4 w-4 text-primary" />
                                      )}
                                      {post.isLocked && (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <h3 className="font-semibold text-lg">{post.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                      {post.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback>
                                            {post.user?.firstName?.[0] || post.user?.username?.[0] || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>
                                          {post.user?.firstName && post.user?.lastName
                                            ? `${post.user.firstName} ${post.user.lastName}`
                                            : post.user?.username || 'Anonymous'}
                                        </span>
                                      </div>
                                      <span>
                                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </span>
                                      {post.replies && (
                                        <span className="flex items-center gap-1">
                                          <MessageSquare className="h-3 w-3" />
                                          {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {post.userId === currentUser?.id && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePost(post.id)
                                          }}
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
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No discussions yet</h3>
                            <p className="text-muted-foreground mb-4">
                              Be the first to start a discussion about this course
                            </p>
                            <Button onClick={() => setShowNewPostForm(true)}>
                              Start Discussion
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'notes' ? (
                  /* Notes Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold">Notes & Bookmarks</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedLesson?.title}
                          </p>
                        </div>
                        {notes.length > 0 && (
                          <Button variant="outline" onClick={exportNotes}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Notes
                          </Button>
                        )}
                      </div>

                      {/* Bookmarks Section */}
                      {bookmarks.length > 0 && (
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookmarkCheck className="h-5 w-5" />
                              Bookmarks ({bookmarks.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {bookmarks.map((bookmark) => (
                                <div
                                  key={bookmark.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => handleJumpToTimestamp(bookmark.timestamp)}
                                >
                                  <div className="flex items-center gap-3">
                                    <BookmarkCheck className="h-5 w-5 text-yellow-600" />
                                    <div>
                                      <div className="font-medium">{formatTimestamp(bookmark.timestamp)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteBookmark(bookmark.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Notes Section */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <StickyNote className="h-5 w-5" />
                                Notes ({notes.length})
                              </CardTitle>
                              <CardDescription>
                                Click on a timestamp to jump to that point in the video
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {notes.length > 0 && (
                            <div className="mb-4">
                              <Input
                                placeholder="Search notes..."
                                value={notesSearchQuery}
                                onChange={(e) => setNotesSearchQuery(e.target.value)}
                                className="w-full"
                              />
                            </div>
                          )}
                          {notes.length > 0 ? (
                            <div className="space-y-4">
                              {notes
                                .filter((note) => 
                                  notesSearchQuery.trim() === '' ||
                                  note.content.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
                                  formatTimestamp(note.timestamp).toLowerCase().includes(notesSearchQuery.toLowerCase())
                                )
                                .map((note) => (
                                <Card key={note.id} className="border-l-4 border-l-primary">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <Button
                                        variant="link"
                                        className="h-auto p-0 text-primary font-medium"
                                        onClick={() => handleJumpToTimestamp(note.timestamp)}
                                      >
                                        {formatTimestamp(note.timestamp)}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteNote(note.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                                ))}
                              </div>
                            ) : notesSearchQuery.trim() !== '' ? (
                              <div className="text-center py-12">
                                <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-xl font-semibold mb-2">No notes found</h3>
                                <p className="text-muted-foreground">
                                  No notes match your search query
                                </p>
                              </div>
                            ) : (
                            <div className="text-center py-12">
                              <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                              <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
                              <p className="text-muted-foreground mb-4">
                                Add notes while watching the video to track important points
                              </p>
                              <Button onClick={() => setActiveTab('lesson')}>
                                Watch Video
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : activeTab === 'transcript' ? (
                  /* Transcript Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Video Transcript
                          </CardTitle>
                          <CardDescription>
                            Full text transcript of the video lesson
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {transcriptLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          ) : transcriptText ? (
                            <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {transcriptText.split('\n').map((line, index) => (
                                  <div key={index} className="mb-2">
                                    {line.trim()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                              <h3 className="text-xl font-semibold mb-2">No transcript available</h3>
                              <p className="text-muted-foreground">
                                This video doesn't have a transcript yet
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : activeTab === 'quiz' ? (
                  /* Quiz Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      {quizLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : quiz ? (
                        selectedAttempt ? (
                          /* Quiz Review Mode */
                          <div className="space-y-6">
                            <Card className="border-2">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                                    <CardDescription className="mt-2">
                                      Quiz Review - Score: {selectedAttempt.score !== undefined ? `${selectedAttempt.score}%` : 'N/A'}
                                    </CardDescription>
                                  </div>
                                  <Button variant="outline" onClick={() => {
                                    setSelectedAttempt(null)
                                    setCurrentAttempt({})
                                  }}>
                                    Back to Quiz
                                  </Button>
                                </div>
                              </CardHeader>
                            </Card>
                            {quizQuestions.map((question, index) => {
                              const userAnswer = selectedAttempt.answers[question.id]
                              const isCorrect = Array.isArray(question.correctAnswer)
                                ? JSON.stringify(question.correctAnswer.sort()) === JSON.stringify((Array.isArray(userAnswer) ? userAnswer : [userAnswer]).sort())
                                : String(question.correctAnswer) === String(userAnswer)
                              
                              return (
                                <Card key={question.id} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <CardTitle className="flex items-center gap-3">
                                        {isCorrect ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        Question {index + 1} ({question.points} points)
                                      </CardTitle>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <p className="text-lg font-medium">{question.question}</p>
                                    
                                    {question.type === 'multiple-choice' && question.options && (
                                      <div className="space-y-2">
                                        {question.options.map((option, optIndex) => {
                                          const isSelected = userAnswer === option || (Array.isArray(userAnswer) && userAnswer.includes(option))
                                          const isCorrectOption = Array.isArray(question.correctAnswer)
                                            ? question.correctAnswer.includes(option)
                                            : question.correctAnswer === option
                                          
                                          return (
                                            <div
                                              key={optIndex}
                                              className={`p-3 border-2 rounded-lg ${
                                                isCorrectOption
                                                  ? 'bg-green-50 border-green-500'
                                                  : isSelected
                                                  ? 'bg-red-50 border-red-500'
                                                  : 'border-gray-200'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                {isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                                <span>{option}</span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                    
                                    {question.type === 'true-false' && (
                                      <div className="space-y-2">
                                        {['True', 'False'].map((option) => {
                                          const isSelected = String(userAnswer).toLowerCase() === option.toLowerCase()
                                          const isCorrect = String(question.correctAnswer).toLowerCase() === option.toLowerCase()
                                          
                                          return (
                                            <div
                                              key={option}
                                              className={`p-3 border-2 rounded-lg ${
                                                isCorrect
                                                  ? 'bg-green-50 border-green-500'
                                                  : isSelected
                                                  ? 'bg-red-50 border-red-500'
                                                  : 'border-gray-200'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                                                <span>{option}</span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                    
                                    {(question.type === 'short-answer' || question.type === 'essay') && (
                                      <div className="space-y-2">
                                        <div className="p-3 bg-muted rounded-lg">
                                          <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                                          <p>{userAnswer || 'No answer provided'}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 border border-green-500 rounded-lg">
                                          <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                                          <p>{Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}</p>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        ) : (
                          /* Quiz Taking Mode */
                          <div className="space-y-6">
                            <Card className="border-2">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                                    {quiz.description && (
                                      <CardDescription className="mt-2">{quiz.description}</CardDescription>
                                    )}
                                    {quiz.instructions && (
                                      <CardDescription className="mt-1">{quiz.instructions}</CardDescription>
                                    )}
                                  </div>
                                  {quizTimeRemaining !== null && (
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-primary">
                                        {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
                                      </div>
                                      <div className="text-xs text-muted-foreground">Time Remaining</div>
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                              {quizAttempts.length > 0 && (
                                <CardContent>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-medium mb-2">Previous Attempts: {quizAttempts.length}</p>
                                    {quiz.maxAttempts && (
                                      <p className="text-xs text-muted-foreground">
                                        Maximum attempts: {quiz.maxAttempts}
                                      </p>
                                    )}
                                    <div className="mt-3 space-y-2">
                                      {quizAttempts.map((attempt, index) => (
                                        <div key={attempt.id} className="flex items-center justify-between">
                                          <span className="text-sm">Attempt {index + 1}</span>
                                          <div className="flex items-center gap-2">
                                            {attempt.score !== undefined && (
                                              <span className="text-sm font-medium">{attempt.score}%</span>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={async () => {
                                                try {
                                                  const fullAttempt = await QuizzesAPI.getQuizAttempt(quiz.id, attempt.id)
                                                  setSelectedAttempt(fullAttempt)
                                                } catch (error) {
                                                  // If fetching fails, use the attempt we have
                                                  setSelectedAttempt(attempt)
                                                }
                                              }}
                                            >
                                              Review
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                            
                            <div className="space-y-6">
                              {quizQuestions.map((question, index) => (
                                <Card key={question.id}>
                                  <CardHeader>
                                    <CardTitle>
                                      Question {index + 1} ({question.points} points)
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <p className="text-lg font-medium">{question.question}</p>
                                    
                                    {question.type === 'multiple-choice' && question.options && (
                                      <RadioGroup
                                        value={currentAttempt[question.id]}
                                        onValueChange={(value) => {
                                          setCurrentAttempt(prev => ({ ...prev, [question.id]: value }))
                                        }}
                                      >
                                        {question.options.map((option, optIndex) => (
                                          <div key={optIndex} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                                            <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer flex-1">
                                              {option}
                                            </Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    )}
                                    
                                    {question.type === 'true-false' && (
                                      <RadioGroup
                                        value={currentAttempt[question.id]}
                                        onValueChange={(value) => {
                                          setCurrentAttempt(prev => ({ ...prev, [question.id]: value }))
                                        }}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="true" id={`${question.id}-true`} />
                                          <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                                            True
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="false" id={`${question.id}-false`} />
                                          <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                                            False
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    )}
                                    
                                    {(question.type === 'short-answer' || question.type === 'essay') && (
                                      <Textarea
                                        placeholder="Type your answer here..."
                                        value={currentAttempt[question.id] || ''}
                                        onChange={(e) => {
                                          setCurrentAttempt(prev => ({ ...prev, [question.id]: e.target.value }))
                                        }}
                                        rows={question.type === 'essay' ? 8 : 4}
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            
                            <div className="flex justify-end gap-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
                                    handleSubmitQuiz()
                                  }
                                }}
                                disabled={submittingQuiz || Object.keys(currentAttempt).length === 0}
                              >
                                {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                              </Button>
                            </div>
                          </div>
                        )
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <FileQuestion className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No quiz available</h3>
                            <p className="text-muted-foreground">
                              This lesson doesn't have a quiz attached
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'qa' ? (
                  /* Q&A Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold">Ask Instructor</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Have a question? Ask your instructor directly
                          </p>
                        </div>
                        {!showQuestionForm && (
                          <Button onClick={() => setShowQuestionForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ask Question
                          </Button>
                        )}
                      </div>

                      {showQuestionForm && (
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>Ask a Question</CardTitle>
                            <CardDescription>
                              Your instructor will receive a notification and respond as soon as possible
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Textarea
                              placeholder="What would you like to ask?"
                              value={newQuestion}
                              onChange={(e) => setNewQuestion(e.target.value)}
                              rows={6}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAskQuestion}
                                disabled={submittingQuestion || !newQuestion.trim()}
                              >
                                {submittingQuestion ? 'Submitting...' : 'Submit Question'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowQuestionForm(false)
                                  setNewQuestion('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {qaLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : questions.length > 0 ? (
                        <div className="space-y-4">
                          {questions.map((question) => (
                            <Card key={question.id}>
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <p className="text-lg font-medium">{question.question}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Asked {new Date(question.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      {question.answer ? (
                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                          Answered
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {question.answer && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-sm">Instructor's Answer</span>
                                        {question.answeredAt && (
                                          <span className="text-xs text-muted-foreground ml-auto">
                                            {new Date(question.answeredAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
                            <p className="text-muted-foreground mb-4">
                              Be the first to ask a question about this course
                            </p>
                            <Button onClick={() => setShowQuestionForm(true)}>
                              Ask a Question
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'announcements' ? (
                  /* Announcements Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold">Course Announcements</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Important updates and announcements from your instructor
                        </p>
                      </div>

                      {announcementsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : announcements.length > 0 ? (
                        <div className="space-y-4">
                          {announcements
                            .sort((a, b) => {
                              if (a.isPinned && !b.isPinned) return -1
                              if (!a.isPinned && b.isPinned) return 1
                              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            })
                            .map((announcement) => (
                              <Card key={announcement.id} className={announcement.isPinned ? 'border-2 border-yellow-400 bg-yellow-50/50' : ''}>
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {announcement.isPinned && (
                                          <Pin className="h-4 w-4 text-yellow-600" />
                                        )}
                                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                      </div>
                                      <CardDescription>
                                        Posted {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                                          month: 'long',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                        {announcement.instructor && (
                                          <> by {announcement.instructor.firstName} {announcement.instructor.lastName}</>
                                        )}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No announcements yet</h3>
                            <p className="text-muted-foreground">
                              Check back later for course updates and announcements
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'polls' ? (
                  /* Polls Tab */
                  <div className="flex-1 overflow-auto bg-background">
                    <div className="max-w-4xl mx-auto p-6">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold">Course Polls</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Participate in polls and surveys
                        </p>
                      </div>

                      {pollsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : polls.length > 0 ? (
                        <div className="space-y-4">
                          {polls.map((poll) => {
                            const userVote = poll.userVote || null
                            const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.voteCount || 0), 0) || 0
                            
                            return (
                              <Card key={poll.id}>
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <CardTitle>{poll.question}</CardTitle>
                                    </div>
                                    {poll.isActive && (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {poll.options && poll.options.length > 0 && (
                                    <div className="space-y-3">
                                      {poll.options.map((option) => {
                                        const voteCount = option.voteCount || 0
                                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
                                        const isSelected = userVote?.includes(option.id)
                                        
                                        return (
                                          <div
                                            key={option.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                              isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-primary/50'
                                            }`}
                                            onClick={() => {
                                              if (poll.isActive && !userVote) {
                                                handleVote(poll.id, [option.id])
                                              }
                                            }}
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                {isSelected && (
                                                  <CheckCircle className="h-4 w-4 text-primary" />
                                                )}
                                                <span className="font-medium">{option.text}</span>
                                              </div>
                                              {totalVotes > 0 && (
                                                <span className="text-sm text-muted-foreground">
                                                  {Math.round(percentage)}% ({voteCount} {voteCount === 1 ? 'vote' : 'votes'})
                                                </span>
                                              )}
                                            </div>
                                            {totalVotes > 0 && (
                                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-primary transition-all"
                                                  style={{ width: `${percentage}%` }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                  {userVote && userVote.length > 0 && (
                                    <p className="text-sm text-muted-foreground italic">
                                      You have already voted on this poll
                                    </p>
                                  )}
                                  {!poll.isActive && (
                                    <p className="text-sm text-muted-foreground italic">
                                      This poll is closed
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <ListChecks className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No polls available</h3>
                            <p className="text-muted-foreground">
                              Check back later for polls and surveys from your instructor
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <Card className="text-center py-12 max-w-md">
                  <CardContent>
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">Select a lesson to begin</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose a lesson from the sidebar to start learning
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      
      {/* Course Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <Award className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Congratulations! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              You've successfully completed <strong>{completedCourse?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <p className="text-lg font-semibold">You've earned a certificate!</p>
            <p className="text-sm text-muted-foreground">
              Your certificate has been generated and is available in your certificates section.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
            >
              Continue Learning
            </Button>
            <Button
              onClick={() => {
                setShowCompletionDialog(false)
                navigate('/certificates')
              }}
            >
              View Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

