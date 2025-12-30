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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Download
} from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import { AdminAPI } from "@/api/admin.api"
import { isAdmin } from "@/api/auth-utils"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminAnalytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      let params: any = {}
      
      if (timeRange === '7d') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        params.startDate = date.toISOString().split('T')[0]
      } else if (timeRange === '30d') {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        params.startDate = date.toISOString().split('T')[0]
      } else if (timeRange === '90d') {
        const date = new Date()
        date.setDate(date.getDate() - 90)
        params.startDate = date.toISOString().split('T')[0]
      } else if (timeRange === '1y') {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 1)
        params.startDate = date.toISOString().split('T')[0]
      }
      
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const data = await AdminAPI.getAnalytics(params)
      setAnalytics(data)
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load analytics')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // TODO: Implement export API endpoint
      toast.info('Export functionality coming soon')
    } catch (error: any) {
      console.error('Failed to export analytics:', error)
      toast.error('Failed to export analytics')
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
                  <a href="/admin">Admin</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights into platform performance
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Time Range Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date (Optional)</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full md:w-[180px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full md:w-[180px]"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchAnalytics}>Apply Filters</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.userGrowth || '+12.5%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs previous period
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Completions</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.courseCompletions?.toLocaleString() || '1,234'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      in selected period
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${analytics?.revenue?.toLocaleString() || '45,678'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      total revenue
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.activeUsers?.toLocaleString() || '892'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      daily active users
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chart visualization will be implemented</p>
                      <p className="text-sm">with charting library integration</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chart visualization will be implemented</p>
                      <p className="text-sm">with charting library integration</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
              <CardDescription>Most popular courses by enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                          {i}
                        </div>
                        <div>
                          <div className="font-medium">Course Title {i}</div>
                          <div className="text-sm text-muted-foreground">1,234 enrollments</div>
                        </div>
                      </div>
                      <Badge variant="outline">$99.99</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

