import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
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
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  Award,
  MessageSquare,
  BarChart3,
  Activity
} from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AdminAPI, AdminStats } from "@/api/admin.api"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const data = await AdminAPI.getDashboardStats()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch admin stats:', error)
      toast.error(error?.response?.data?.message || 'Failed to load dashboard statistics')
      // Set empty stats on error to prevent crashes
      setStats({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalCourses: 0,
        activeCourses: 0,
        pendingCourses: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingReviews: 0,
        activeReports: 0,
        recentSignups: 0,
        coursesThisMonth: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Platform overview and management
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.recentSignups} new this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Courses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalCourses}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.pendingCourses} pending approval
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats ? formatCurrency(stats.totalRevenue) : '$0.00'}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats ? formatCurrency(stats.monthlyRevenue) : '$0.00'} this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.activeReports}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.pendingReviews} pending reviews
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Teachers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.totalTeachers}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.totalStudents}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Active Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.activeCourses}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="text-base">User Management</CardTitle>
                <CardDescription>Manage users and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Users</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/courses')}>
              <CardHeader>
                <CardTitle className="text-base">Course Moderation</CardTitle>
                <CardDescription>Review and approve courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Review Courses</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/reports')}>
              <CardHeader>
                <CardTitle className="text-base">Content Reports</CardTitle>
                <CardDescription>Review reported content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Reports</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/analytics')}>
              <CardHeader>
                <CardTitle className="text-base">Analytics</CardTitle>
                <CardDescription>Platform analytics & insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Analytics</Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity to display
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Activity will appear here as events occur on the platform
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

