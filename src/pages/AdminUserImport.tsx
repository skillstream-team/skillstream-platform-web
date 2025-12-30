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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"

export function AdminUserImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    role: "",
    isActive: "",
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error("Please select a CSV file")
        return
      }
      setSelectedFile(file)
      setImportResults(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import")
      return
    }

    setIsImporting(true)
    try {
      const result = await AdminAPI.importUsers(selectedFile)
      setImportResults(result)
      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.imported} users`)
      } else {
        toast.warning(`Imported ${result.imported} users, ${result.failed} failed`)
      }
    } catch (error: any) {
      console.error("Import failed:", error)
      toast.error(error?.response?.data?.message || "Failed to import users")
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params: any = {}
      if (exportFilters.role) params.role = exportFilters.role
      if (exportFilters.isActive !== "") {
        params.isActive = exportFilters.isActive === "true"
      }

      const blob = await AdminAPI.exportUsers(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Users exported successfully")
    } catch (error: any) {
      console.error("Export failed:", error)
      toast.error(error?.response?.data?.message || "Failed to export users")
    } finally {
      setIsExporting(false)
    }
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
                  <a href="/admin">Admin</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>User Import/Export</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">User Import/Export</h1>
            <p className="text-muted-foreground mt-1">
              Import users from CSV or export user data
            </p>
          </div>

          <Tabs defaultValue="import" className="space-y-4">
            <TabsList>
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-2" />
                Import Users
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import Users from CSV</CardTitle>
                  <CardDescription>
                    Upload a CSV file to import users in bulk. The CSV should include columns:
                    email, password, firstName, lastName, role (STUDENT/TEACHER/ADMIN)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvFile">CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                    {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Upload className="h-4 w-4 mr-2" />
                    Import Users
                  </Button>

                  {importResults && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Import Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Imported: {importResults.imported} users</span>
                        </div>
                        {importResults.failed > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Failed: {importResults.failed} users</span>
                          </div>
                        )}
                        {importResults.errors && importResults.errors.length > 0 && (
                          <div className="mt-4">
                            <Label>Errors:</Label>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                              {importResults.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Users to CSV</CardTitle>
                  <CardDescription>
                    Export user data to a CSV file with optional filters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="exportRole">Role Filter</Label>
                      <select
                        id="exportRole"
                        value={exportFilters.role}
                        onChange={(e) =>
                          setExportFilters(prev => ({ ...prev, role: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All Roles</option>
                        <option value="STUDENT">Students</option>
                        <option value="TEACHER">Teachers</option>
                        <option value="ADMIN">Admins</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exportStatus">Status Filter</Label>
                      <select
                        id="exportStatus"
                        value={exportFilters.isActive}
                        onChange={(e) =>
                          setExportFilters(prev => ({ ...prev, isActive: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Download className="h-4 w-4 mr-2" />
                    Export Users
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

