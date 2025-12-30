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
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft,
  Save,
  X,
  Plus,
  ChevronDown,
  Upload,
  Image as ImageIcon
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { getCurrentUser } from "@/api/auth-utils"
import { CoursesAPI } from "@/api/courses.api"
import { CategoriesAPI, Category } from "@/api/categories.api"
import { toast } from "sonner"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"


const difficultyLevels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
]

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
]

export function CreateCourse() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const { settings } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "BEGINNER" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
    duration: "",
    language: "English",
    categoryId: "",
    thumbnailUrl: "",
    learningObjectives: [] as string[],
    requirements: [] as string[],
  })

  const [objectiveInput, setObjectiveInput] = useState("")
  const [requirementInput, setRequirementInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await CategoriesAPI.getCategories({ limit: 100 })
        setCategories(response.categories || [])
      } catch (error: any) {
        console.error('Failed to fetch categories:', error)
        // Use fallback categories if API fails
        setCategories([
          { id: '1', name: 'Programming', createdAt: new Date().toISOString() },
          { id: '2', name: 'Design', createdAt: new Date().toISOString() },
          { id: '3', name: 'Business', createdAt: new Date().toISOString() },
          { id: '4', name: 'Marketing', createdAt: new Date().toISOString() },
          { id: '5', name: 'Photography', createdAt: new Date().toISOString() },
        ])
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objectiveInput.trim()]
      }))
      setObjectiveInput("")
    }
  }

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }))
      setRequirementInput("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPEG, etc.)')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setThumbnailFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
        // Also set the thumbnailUrl to the data URL so it can be submitted
        setFormData(prev => ({ ...prev, thumbnailUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview("")
    setFormData(prev => ({ ...prev, thumbnailUrl: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleThumbnailUrlChange = (url: string) => {
    // Clear file if URL is being used
    if (url && thumbnailFile) {
      setThumbnailFile(null)
      setThumbnailPreview("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    handleInputChange("thumbnailUrl", url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Course title is required")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Course description is required")
      return
    }
    if (!formData.categoryId) {
      toast.error("Please select a category")
      return
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("Please enter a valid duration")
      return
    }
    
    if (!user?.id) {
      toast.error("You must be logged in to create a course")
      return
    }

    setIsSubmitting(true)

    try {
      const newCourse = await CoursesAPI.createCourse({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: 0, // Courses are subscription-based, no individual pricing
        difficulty: formData.difficulty,
        duration: parseInt(formData.duration),
        language: formData.language,
        categoryId: formData.categoryId,
        instructorId: user.id,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        learningObjectives: formData.learningObjectives.length > 0 ? formData.learningObjectives : undefined,
        requirements: formData.requirements.length > 0 ? formData.requirements : undefined,
      })

      toast.success("Course created successfully!")
      // Navigate to builder, and if user goes back to courses list, it will refresh
      navigate(`/courses/${newCourse.id}/builder`, { state: { refreshCourses: true } })
    } catch (error: any) {
      console.error("Failed to create course:", error)
      toast.error(error?.response?.data?.message || "Failed to create course. Please try again.")
    } finally {
      setIsSubmitting(false)
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
                <BreadcrumbPage>Create Course</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {settings?.requireCourseApproval && (
            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/50">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                All courses require admin approval before they become available to students. 
                Your course will be reviewed after submission.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
              <p className="text-muted-foreground">
                Fill in the details to create your course
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Essential details about your course
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Course Title *
                      </label>
                      <Input
                        id="title"
                        placeholder="e.g., Introduction to React"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        placeholder="Describe what students will learn in this course..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        required
                        rows={5}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="duration" className="text-sm font-medium">
                        Duration (min) *
                      </label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        placeholder="120"
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", e.target.value)}
                        required
                        className="w-32"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Course Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Settings</CardTitle>
                    <CardDescription>
                      Configure course difficulty and category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty Level *</label>
                      <div className="flex gap-2 flex-wrap">
                        {difficultyLevels.map((level) => (
                          <Button
                            key={level.value}
                            type="button"
                            variant={formData.difficulty === level.value ? "default" : "outline"}
                            onClick={() => handleInputChange("difficulty", level.value)}
                            className="flex-1 min-w-[120px]"
                          >
                            {level.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category *</label>
                      {loadingCategories ? (
                        <p className="text-sm text-muted-foreground">Loading categories...</p>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {categories.map((category) => (
                            <Button
                              key={category.id}
                              type="button"
                              variant={formData.categoryId === category.id ? "default" : "outline"}
                              onClick={() => handleInputChange("categoryId", category.id)}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language *</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {formData.language}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {languages.map((lang) => (
                            <DropdownMenuItem
                              key={lang}
                              onClick={() => handleInputChange("language", lang)}
                            >
                              {lang}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Thumbnail */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Thumbnail</CardTitle>
                    <CardDescription>
                      Upload an image or enter an image URL for your course thumbnail
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Image</label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                          onChange={handleThumbnailFileChange}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {thumbnailFile ? 'Change Image' : 'Select Image'}
                        </Button>
                        {thumbnailFile && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemoveThumbnail}
                            size="icon"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PNG, JPEG, GIF, WebP, SVG (Max 5MB)
                      </p>
                    </div>

                    {/* OR Divider */}
                    {!thumbnailFile && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                    )}

                    {/* URL Input */}
                    {!thumbnailFile && (
                      <div className="space-y-2">
                        <label htmlFor="thumbnailUrl" className="text-sm font-medium">
                          Image URL
                        </label>
                        <Input
                          id="thumbnailUrl"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={formData.thumbnailUrl}
                          onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Preview */}
                    {(thumbnailPreview || formData.thumbnailUrl) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preview</label>
                        <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                          <img
                            src={thumbnailPreview || formData.thumbnailUrl}
                            alt="Course thumbnail preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          {thumbnailPreview && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={handleRemoveThumbnail}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {thumbnailFile && (
                          <p className="text-xs text-muted-foreground">
                            Selected: {thumbnailFile.name} ({(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                    <CardDescription>
                      What will students learn? (Optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a learning objective..."
                        value={objectiveInput}
                        onChange={(e) => setObjectiveInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addObjective()
                          }
                        }}
                      />
                      <Button type="button" onClick={addObjective}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.learningObjectives.length > 0 && (
                      <div className="space-y-2">
                        {formData.learningObjectives.map((objective, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm">{objective}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeObjective(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                    <CardDescription>
                      Prerequisites for this course (Optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a requirement..."
                        value={requirementInput}
                        onChange={(e) => setRequirementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addRequirement()
                          }
                        }}
                      />
                      <Button type="button" onClick={addRequirement}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.requirements.length > 0 && (
                      <div className="space-y-2">
                        {formData.requirements.map((requirement, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm">{requirement}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRequirement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/courses")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Course
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

