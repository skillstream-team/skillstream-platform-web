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
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  Upload,
  Link as LinkIcon,
  File,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink
} from "lucide-react"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { CourseImportAPI, CourseImportStatus } from "@/api/course-import.api"
import { isAdmin } from "@/api/auth-utils"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const importSources = [
  { value: 'FILE', label: 'Upload File (CSV/JSON)', icon: File },
  { value: 'SCORM', label: 'SCORM Package', icon: File },
  { value: 'URL', label: 'Import from URL', icon: LinkIcon },
  { value: 'MOODLE', label: 'Moodle LMS', icon: ExternalLink },
  { value: 'CANVAS', label: 'Canvas LMS', icon: ExternalLink },
  { value: 'UDEMY', label: 'Udemy', icon: ExternalLink },
  { value: 'COURSERA', label: 'Coursera', icon: ExternalLink },
]

export function ImportCourses() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [importSource, setImportSource] = useState<string>('FILE')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [importOptions, setImportOptions] = useState({
    importModules: true,
    importLessons: true,
    importQuizzes: true,
    importMedia: false,
    overwriteExisting: false,
  })
  const [assignInstructorId, setAssignInstructorId] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<CourseImportStatus | null>(null)
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!isAdmin()) {
      toast.error('Only admins can import courses')
      return
    }

    if (importSource === 'FILE' || importSource === 'SCORM') {
      if (!selectedFile) {
        toast.error('Please select a file to import')
        return
      }
    }

    if (importSource === 'URL') {
      if (!importUrl.trim()) {
        toast.error('Please enter a URL to import from')
        return
      }
    }

    try {
      setIsImporting(true)
      
      const payload = {
        source: {
          type: importSource as any,
          file: selectedFile || undefined,
          url: importUrl || undefined,
        },
        options: {
          ...importOptions,
          assignInstructorId: assignInstructorId || undefined,
        },
      }

      const response = await CourseImportAPI.importCourses(payload)
      setImportStatus({
        id: response.id,
        status: response.status,
        progress: response.progress || 0,
        importedCount: response.importedCourses?.length || 0,
        totalCount: response.importedCourses?.length || 0,
        errors: response.errors,
        message: response.message,
        importedCourses: response.importedCourses,
      })

      // Start polling for status updates
      if (response.status === 'PENDING' || response.status === 'PROCESSING') {
        const interval = setInterval(async () => {
          try {
            const status = await CourseImportAPI.getImportStatus(response.id)
            setImportStatus(status)
            
            if (status.status === 'COMPLETED' || status.status === 'FAILED') {
              clearInterval(interval)
              setIsImporting(false)
            }
          } catch (error) {
            console.error('Failed to check import status:', error)
            clearInterval(interval)
            setIsImporting(false)
          }
        }, 2000) // Poll every 2 seconds
        
        setStatusInterval(interval)
      } else {
        setIsImporting(false)
      }

      toast.success('Import started successfully')
    } catch (error: any) {
      console.error('Import failed:', error)
      toast.error(error?.response?.data?.message || 'Failed to import courses')
      setIsImporting(false)
    }
  }

  const handleCancel = async () => {
    if (statusInterval) {
      clearInterval(statusInterval)
      setStatusInterval(null)
    }
    
    if (importStatus?.id) {
      try {
        await CourseImportAPI.cancelImport(importStatus.id)
        toast.info('Import cancelled')
      } catch (error) {
        console.error('Failed to cancel import:', error)
      }
    }
    
    setIsImporting(false)
    setImportStatus(null)
  }

  const handleViewImportedCourses = () => {
    if (importStatus?.importedCourses && importStatus.importedCourses.length > 0) {
      navigate('/courses')
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/">Dashboard</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/courses">Courses</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Import Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Import Courses</h1>
            <p className="text-muted-foreground mt-1">
              Import courses from external sources or upload course files
            </p>
          </div>

          {/* Import Status */}
          {importStatus && (
            <Alert className={
              importStatus.status === 'COMPLETED' 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50' 
                : importStatus.status === 'FAILED' 
                ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50' 
                : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50'
            }>
              <div className="flex items-center gap-2">
                {importStatus.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />}
                {importStatus.status === 'FAILED' && <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />}
                {(importStatus.status === 'PENDING' || importStatus.status === 'PROCESSING') && <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-500" />}
                <AlertTitle className={
                  importStatus.status === 'COMPLETED' 
                    ? 'text-green-900 dark:text-green-100' 
                    : importStatus.status === 'FAILED' 
                    ? 'text-red-900 dark:text-red-100' 
                    : 'text-blue-900 dark:text-blue-100'
                }>
                  Import {importStatus.status === 'COMPLETED' ? 'Completed' : importStatus.status === 'FAILED' ? 'Failed' : 'In Progress'}
                </AlertTitle>
              </div>
              <AlertDescription className={`mt-2 ${
                importStatus.status === 'COMPLETED' 
                  ? 'text-green-800 dark:text-green-200' 
                  : importStatus.status === 'FAILED' 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {importStatus.status === 'PROCESSING' && (
                  <>
                    <Progress value={importStatus.progress} className="mb-2" />
                    <p>Progress: {importStatus.progress}% ({importStatus.importedCount} of {importStatus.totalCount} courses)</p>
                  </>
                )}
                {importStatus.status === 'COMPLETED' && (
                  <div>
                    <p className="mb-2">Successfully imported {importStatus.importedCount} course(s)</p>
                    {importStatus.importedCourses && importStatus.importedCourses.length > 0 && (
                      <Button onClick={handleViewImportedCourses} size="sm" className="mt-2">
                        View Imported Courses
                      </Button>
                    )}
                  </div>
                )}
                {importStatus.status === 'FAILED' && importStatus.errors && (
                  <div className="mt-2">
                    <p className="font-semibold">Errors:</p>
                    <ul className="list-disc list-inside mt-1">
                      {importStatus.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {importStatus.message && (
                  <p className="mt-2">{importStatus.message}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Import Source</CardTitle>
              <CardDescription>
                Choose how you want to import courses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source Type Selection */}
              <div className="space-y-2">
                <Label>Import Source Type</Label>
                <Select value={importSource} onValueChange={setImportSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {importSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        <div className="flex items-center gap-2">
                          <source.icon className="h-4 w-4" />
                          {source.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              {(importSource === 'FILE' || importSource === 'SCORM') && (
                <div className="space-y-2">
                  <Label>Select File</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept={importSource === 'SCORM' ? '.zip' : '.csv,.json,.zip'}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? selectedFile.name : 'Choose File'}
                    </Button>
                    {selectedFile && (
                      <span className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {importSource === 'SCORM' 
                      ? 'Upload a SCORM package (.zip file)'
                      : 'Supported formats: CSV, JSON, or ZIP archive'}
                  </p>
                </div>
              )}

              {/* URL Input */}
              {importSource === 'URL' && (
                <div className="space-y-2">
                  <Label>Import URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/courses/export"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isImporting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the URL to import courses from
                  </p>
                </div>
              )}

              {/* LMS-specific URL inputs */}
              {(importSource === 'MOODLE' || importSource === 'CANVAS' || importSource === 'UDEMY' || importSource === 'COURSERA') && (
                <div className="space-y-2">
                  <Label>Platform URL</Label>
                  <Input
                    type="url"
                    placeholder={`Enter ${importSource} URL or API endpoint`}
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isImporting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the {importSource} URL or API endpoint to import from
                  </p>
                </div>
              )}

              {/* Import Options */}
              <div className="space-y-4 border-t pt-4">
                <Label>Import Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importModules"
                      checked={importOptions.importModules}
                      onCheckedChange={(checked) =>
                        setImportOptions({ ...importOptions, importModules: !!checked })
                      }
                      disabled={isImporting}
                    />
                    <Label htmlFor="importModules" className="cursor-pointer">
                      Import Modules
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importLessons"
                      checked={importOptions.importLessons}
                      onCheckedChange={(checked) =>
                        setImportOptions({ ...importOptions, importLessons: !!checked })
                      }
                      disabled={isImporting}
                    />
                    <Label htmlFor="importLessons" className="cursor-pointer">
                      Import Lessons
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importQuizzes"
                      checked={importOptions.importQuizzes}
                      onCheckedChange={(checked) =>
                        setImportOptions({ ...importOptions, importQuizzes: !!checked })
                      }
                      disabled={isImporting}
                    />
                    <Label htmlFor="importQuizzes" className="cursor-pointer">
                      Import Quizzes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importMedia"
                      checked={importOptions.importMedia}
                      onCheckedChange={(checked) =>
                        setImportOptions({ ...importOptions, importMedia: !!checked })
                      }
                      disabled={isImporting}
                    />
                    <Label htmlFor="importMedia" className="cursor-pointer">
                      Import Media Files (videos, images, etc.)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overwriteExisting"
                      checked={importOptions.overwriteExisting}
                      onCheckedChange={(checked) =>
                        setImportOptions({ ...importOptions, overwriteExisting: !!checked })
                      }
                      disabled={isImporting}
                    />
                    <Label htmlFor="overwriteExisting" className="cursor-pointer">
                      Overwrite Existing Courses (if duplicate found)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Assign Instructor */}
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="instructorId">Assign Instructor ID (Optional)</Label>
                <Input
                  id="instructorId"
                  type="text"
                  placeholder="Instructor user ID"
                  value={assignInstructorId}
                  onChange={(e) => setAssignInstructorId(e.target.value)}
                  disabled={isImporting}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to assign yourself as the instructor
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || (importSource === 'FILE' && !selectedFile) || (importSource === 'URL' && !importUrl)}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
                {isImporting && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel Import
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/courses')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help/Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Import Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• File imports support CSV, JSON, and ZIP formats</p>
              <p>• SCORM packages must be in ZIP format</p>
              <p>• URL imports require a publicly accessible endpoint</p>
              <p>• Media files import may take longer depending on file sizes</p>
              <p>• Duplicate courses will be skipped unless "Overwrite Existing" is enabled</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

