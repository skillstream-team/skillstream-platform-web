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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Users,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

export function AdminBulkOperations() {
  const [activeTab, setActiveTab] = useState("users")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [operation, setOperation] = useState<{
    type: 'users' | 'courses'
    action: string
    ids: string[]
    payload: any
  } | null>(null)

  // User bulk operations
  const [userIds, setUserIds] = useState("")
  const [userAction, setUserAction] = useState("activate")
  const [userRole, setUserRole] = useState("")

  // Course bulk operations
  const [courseIds, setCourseIds] = useState("")
  const [courseAction, setCourseAction] = useState("approve")
  const [rejectionReason, setRejectionReason] = useState("")

  const handleUserSubmit = async () => {
    const ids = userIds.split('\n').filter(id => id.trim()).map(id => id.trim())
    if (ids.length === 0) {
      toast.error("Please enter at least one user ID")
      return
    }

    let payload: any = {}
    if (userAction === "activate") {
      payload.isActive = true
    } else if (userAction === "deactivate") {
      payload.isActive = false
    } else if (userAction === "changeRole" && userRole) {
      payload.role = userRole
    }

    setOperation({
      type: 'users',
      action: userAction,
      ids,
      payload,
    })
    setIsConfirmDialogOpen(true)
  }

  const handleCourseSubmit = async () => {
    const ids = courseIds.split('\n').filter(id => id.trim()).map(id => id.trim())
    if (ids.length === 0) {
      toast.error("Please enter at least one course ID")
      return
    }

    let payload: any = {}
    if (courseAction === "approve") {
      payload.status = "APPROVED"
    } else if (courseAction === "reject") {
      payload.status = "REJECTED"
      if (rejectionReason) {
        payload.rejectionReason = rejectionReason
      }
    } else if (courseAction === "pending") {
      payload.status = "PENDING"
    }

    setOperation({
      type: 'courses',
      action: courseAction,
      ids,
      payload,
    })
    setIsConfirmDialogOpen(true)
  }

  const confirmOperation = async () => {
    if (!operation) return
    setIsProcessing(true)
    try {
      if (operation.type === 'users') {
        await AdminAPI.bulkUpdateUsers(operation.ids, operation.payload)
        toast.success(`Successfully updated ${operation.ids.length} users`)
      } else {
        await AdminAPI.bulkUpdateCourses(operation.ids, operation.payload)
        toast.success(`Successfully updated ${operation.ids.length} courses`)
      }
      setIsConfirmDialogOpen(false)
      setOperation(null)
      // Reset forms
      setUserIds("")
      setCourseIds("")
      setRejectionReason("")
    } catch (error: any) {
      console.error("Bulk operation failed:", error)
      toast.error(error?.response?.data?.message || "Bulk operation failed")
    } finally {
      setIsProcessing(false)
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
                <BreadcrumbPage>Bulk Operations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Bulk Operations</h1>
            <p className="text-muted-foreground mt-1">
              Perform bulk actions on users and courses
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Bulk User Actions
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Bulk Course Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk User Operations</CardTitle>
                  <CardDescription>
                    Update multiple users at once. Enter user IDs (one per line).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userIds">User IDs (one per line)</Label>
                    <Textarea
                      id="userIds"
                      value={userIds}
                      onChange={(e) => setUserIds(e.target.value)}
                      placeholder="user-id-1&#10;user-id-2&#10;user-id-3"
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userAction">Action</Label>
                    <Select value={userAction} onValueChange={setUserAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">Activate Users</SelectItem>
                        <SelectItem value="deactivate">Deactivate Users</SelectItem>
                        <SelectItem value="changeRole">Change Role</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userAction === "changeRole" && (
                    <div className="space-y-2">
                      <Label htmlFor="userRole">New Role</Label>
                      <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="TEACHER">Teacher</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleUserSubmit} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Execute Bulk Operation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Course Operations</CardTitle>
                  <CardDescription>
                    Update multiple courses at once. Enter course IDs (one per line).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseIds">Course IDs (one per line)</Label>
                    <Textarea
                      id="courseIds"
                      value={courseIds}
                      onChange={(e) => setCourseIds(e.target.value)}
                      placeholder="course-id-1&#10;course-id-2&#10;course-id-3"
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseAction">Action</Label>
                    <Select value={courseAction} onValueChange={setCourseAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">Approve Courses</SelectItem>
                        <SelectItem value="reject">Reject Courses</SelectItem>
                        <SelectItem value="pending">Set to Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {courseAction === "reject" && (
                    <div className="space-y-2">
                      <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        rows={4}
                      />
                    </div>
                  )}
                  <Button onClick={handleCourseSubmit} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Execute Bulk Operation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirmation Dialog */}
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Operation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {operation?.action} {operation?.ids.length} {operation?.type}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmOperation}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

