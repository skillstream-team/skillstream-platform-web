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
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Save,
  PenTool,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Upload
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { WhiteboardsAPI } from "@/api/whiteboards.api"
import { toast } from "sonner"

export function WhiteboardEditor() {
  const { courseId, lessonId, whiteboardId } = useParams<{ courseId: string; lessonId?: string; whiteboardId?: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [title, setTitle] = useState("New Whiteboard")
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set default drawing style
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load whiteboard if editing
    if (whiteboardId) {
      loadWhiteboard(whiteboardId)
    }
  }, [whiteboardId])

  const loadWhiteboard = async (id: string) => {
    try {
      const whiteboard = await WhiteboardsAPI.getWhiteboard(id)
      setTitle(whiteboard.title)
      // Load canvas content if available
      if (whiteboard.content && canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx && whiteboard.content.imageData) {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0)
            saveState()
          }
          img.src = whiteboard.content.imageData
        }
      }
    } catch (error: any) {
      console.error('Failed to load whiteboard:', error)
      toast.error('Failed to load whiteboard')
    }
  }

  const saveState = () => {
    if (!canvasRef.current) return
    const dataURL = canvasRef.current.toDataURL()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(dataURL)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    saveState()
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      loadStateFromHistory(newIndex)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      loadStateFromHistory(newIndex)
    }
  }

  const loadStateFromHistory = (index: number) => {
    if (!canvasRef.current || !history[index]) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = history[index]
  }

  const handleSave = async () => {
    if (!courseId) {
      toast.error("Course ID is missing")
      return
    }

    setSaving(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const imageData = canvas.toDataURL()
      const content = { imageData }

      if (whiteboardId) {
        await WhiteboardsAPI.updateWhiteboard(whiteboardId, {
          title,
          content,
        })
        toast.success("Whiteboard updated successfully!")
      } else {
        await WhiteboardsAPI.createWhiteboard({
          courseId,
          lessonId,
          title,
          content,
        })
        toast.success("Whiteboard created successfully!")
      }
    } catch (error: any) {
      console.error("Failed to save whiteboard:", error)
      toast.error(error?.response?.data?.message || "Failed to save whiteboard. Please try again.")
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
                  <Link to={`/courses/${courseId}/builder`}>Course Builder</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Whiteboard Editor</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Whiteboard Editor</h1>
              <p className="text-muted-foreground">
                Draw and annotate on your whiteboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/courses/${courseId}/builder`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Whiteboard"}
              </Button>
            </div>
          </div>

          {/* Whiteboard Card */}
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Whiteboard Title"
                    className="max-w-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCanvas}>
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white" style={{ height: '600px' }}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ touchAction: 'none' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

