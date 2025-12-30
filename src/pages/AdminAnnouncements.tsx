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
import { Search, Plus, MoreVertical, Edit, Trash2, Pin, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AnnouncementsAPI, Announcement } from "@/api/announcements.api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    // Note: AnnouncementsAPI.getAnnouncements requires a courseId
    // For admin view, we'd need a backend endpoint to get all announcements
    // For now, this is a placeholder that shows the structure
    setLoading(false)
  }, [pagination.page])

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
                <BreadcrumbPage>Announcements Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Announcements Management</h1>
              <p className="text-muted-foreground mt-1">
                View and manage all course announcements
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Backend Implementation Required</AlertTitle>
            <AlertDescription>
              This feature requires a backend endpoint to get all announcements across all courses.
              The current AnnouncementsAPI.getAnnouncements requires a courseId. 
              Please implement GET /admin/announcements endpoint.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>All Announcements</CardTitle>
              <CardDescription>
                View announcements across all courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Backend API endpoint needs to be implemented to view all announcements.</p>
                <p className="text-sm mt-2">Required: GET /admin/announcements</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

