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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Send,
  Plus,
  Search,
  Loader2,
  Mail,
  Bell,
  Users,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"

interface Broadcast {
  id: string
  title: string
  message: string
  targetAudience: string
  sentTo: number
  sendEmail: boolean
  sendPush: boolean
  createdAt: string
  createdBy?: string
}

export function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetAudience: "all" as "all" | "students" | "teachers" | "admins",
    sendEmail: true,
    sendPush: true,
  })

  useEffect(() => {
    fetchBroadcasts()
  }, [pagination.page])

  const fetchBroadcasts = async () => {
    try {
      setLoading(true)
      // Note: Backend endpoint GET /admin/broadcasts needs to be implemented
      // For now, this will fail gracefully
      // const response = await AdminAPI.getBroadcasts({ page: pagination.page, limit: pagination.limit })
      // setBroadcasts(response.broadcasts || [])
      // setPagination(response.pagination || pagination)
      setBroadcasts([]) // Placeholder until backend is implemented
    } catch (error: any) {
      console.error("Failed to fetch broadcasts:", error)
      // Don't show error if endpoint doesn't exist yet
      if (error?.response?.status !== 404) {
        toast.error("Failed to load broadcasts")
      }
      setBroadcasts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await AdminAPI.sendBroadcast(formData)
      toast.success(`Broadcast sent successfully to ${formData.targetAudience}`)
      setIsDialogOpen(false)
      setFormData({
        title: "",
        message: "",
        targetAudience: "all",
        sendEmail: true,
        sendPush: true,
      })
      fetchBroadcasts()
    } catch (error: any) {
      console.error("Failed to send broadcast:", error)
      toast.error(error?.response?.data?.message || "Failed to send broadcast")
    } finally {
      setIsSubmitting(false)
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
                <BreadcrumbPage>Broadcasts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Broadcast Management</h1>
              <p className="text-muted-foreground mt-1">
                Send announcements and notifications to users
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Broadcast</DialogTitle>
                  <DialogDescription>
                    Send a notification to selected users
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Notification title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, message: e.target.value }))
                        }
                        placeholder="Notification message"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Select
                        value={formData.targetAudience}
                        onValueChange={(value: any) =>
                          setFormData(prev => ({ ...prev, targetAudience: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="students">Students Only</SelectItem>
                          <SelectItem value="teachers">Teachers Only</SelectItem>
                          <SelectItem value="admins">Admins Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <Label>Delivery Methods</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendEmail"
                          checked={formData.sendEmail}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, sendEmail: !!checked }))
                          }
                        />
                        <Label htmlFor="sendEmail" className="font-normal flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Send Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendPush"
                          checked={formData.sendPush}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, sendPush: !!checked }))
                          }
                        />
                        <Label htmlFor="sendPush" className="font-normal flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Send Push Notification
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Send className="h-4 w-4 mr-2" />
                      Send Broadcast
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Broadcast History */}
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>
                View past broadcasts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : broadcasts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No broadcasts sent yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Send First Broadcast
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Sent To</TableHead>
                        <TableHead>Methods</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcasts.map((broadcast) => (
                        <TableRow key={broadcast.id}>
                          <TableCell className="font-medium">
                            {broadcast.title}
                          </TableCell>
                          <TableCell>
                            {broadcast.targetAudience}
                          </TableCell>
                          <TableCell>{broadcast.sentTo} users</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {broadcast.sendEmail && (
                                <Mail className="h-4 w-4 text-blue-500" />
                              )}
                              {broadcast.sendPush && (
                                <Bell className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(broadcast.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {pagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) =>
                          setPagination(prev => ({ ...prev, page }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

