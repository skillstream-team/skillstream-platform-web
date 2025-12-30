import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Filter,
  ChevronDown,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Search,
  BookOpen
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { TeacherEarningsAPI, Earnings as EarningRecord, EarningsStats } from "@/api/teacher-earnings.api"
import { Pagination as PaginationType } from "@/api/types"
import { Pagination } from "@/components/ui/pagination"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TabType = 'overview' | 'payouts' | 'transactions'

export function Earnings() {
  const { settings } = useSystemSettings()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [earningsStats, setEarningsStats] = useState<EarningsStats | null>(null)
  const [earnings, setEarnings] = useState<EarningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchEarningsStats()
    fetchEarnings()
  }, [])

  const fetchEarningsStats = async () => {
    try {
      setEarningsLoading(true)
      const stats = await TeacherEarningsAPI.getEarningsStats()
      setEarningsStats(stats)
    } catch (error: any) {
      console.error('Failed to fetch earnings stats:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
    } finally {
      setEarningsLoading(false)
    }
  }

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await TeacherEarningsAPI.getEarnings(params)
      setEarnings(response.earnings || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch earnings:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setEarnings([])
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetched.current) return
    // Reset to page 1 when filters change
    if (pagination.page === 1) {
      fetchEarnings()
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab])

  useEffect(() => {
    if (!hasFetched.current) return
    fetchEarnings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchEarningsStats()
    fetchEarnings()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Local search filtering (API doesn't support search parameter)
  const filteredEarnings = earnings.filter((earning) => {
    if (searchTerm) {
      const courseTitle = earning.course?.title || ''
      return courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const handleRequestPayout = async () => {
    if (!earningsStats?.pendingEarnings || earningsStats.pendingEarnings <= 0) {
      toast.error('No pending earnings available for payout')
      return
    }

    try {
      await TeacherEarningsAPI.requestPayout()
      toast.success('Payout request submitted successfully')
      fetchEarningsStats()
      fetchEarnings()
    } catch (error: any) {
      console.error('Failed to request payout:', error)
      toast.error('Failed to request payout. Please try again.')
    }
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'payouts' as TabType, label: 'Payouts' },
    { id: 'transactions' as TabType, label: 'Transactions' },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Earnings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
              <p className="text-muted-foreground">
                Track your earnings, payouts, and transactions
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Earnings
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : earningsStats ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(earningsStats.totalEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          All time earnings
                        </p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold">$0.00</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Earnings
                    </CardTitle>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : earningsStats ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(earningsStats.pendingEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Available for payout
                        </p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold">$0.00</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      This Month
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : earningsStats ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(earningsStats.thisMonthEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(
                            calculatePercentageChange(
                              earningsStats.thisMonthEarnings,
                              earningsStats.lastMonthEarnings
                            )
                          )} from last month
                        </p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold">$0.00</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Paid Earnings
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : earningsStats ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(earningsStats.paidEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total paid out
                        </p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold">$0.00</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Earnings</CardTitle>
                  <CardDescription>
                    Your latest earnings transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredEarnings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEarnings.slice(0, 10).map((earning) => (
                        <div
                          key={earning.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {earning.course?.title || 'Unknown Course'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(earning.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold">
                                {formatCurrency(earning.amount)}
                              </p>
                              {getStatusBadge(earning.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No earnings found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              {/* Payment Settings Info */}
              {settings && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-1">
                      <p>Platform Fee: {settings.platformFee || 10}%</p>
                      {settings.minimumPayout && (
                        <p>Minimum Payout: {formatCurrency(settings.minimumPayout)}</p>
                      )}
                      {settings.payoutSchedule && (
                        <p>Payout Schedule: {settings.payoutSchedule.charAt(0).toUpperCase() + settings.payoutSchedule.slice(1)}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Request Payout Card */}
              {earningsStats && earningsStats.pendingEarnings > 0 && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30">
                  <CardHeader>
                    <CardTitle>Request Payout</CardTitle>
                    <CardDescription>
                      You have {formatCurrency(earningsStats.pendingEarnings)} available for payout
                      {settings?.minimumPayout && earningsStats.pendingEarnings < settings.minimumPayout && (
                        <span className="block mt-1 text-sm text-muted-foreground">
                          Minimum payout threshold: {formatCurrency(settings.minimumPayout)}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleRequestPayout}
                      disabled={settings?.minimumPayout ? earningsStats.pendingEarnings < settings.minimumPayout : false}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Request Payout
                    </Button>
                    {settings?.minimumPayout && earningsStats.pendingEarnings < settings.minimumPayout && (
                      <p className="text-sm text-muted-foreground mt-2">
                        You need {formatCurrency(settings.minimumPayout - earningsStats.pendingEarnings)} more to request a payout
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payouts List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Payout History</CardTitle>
                      <CardDescription>
                        View your payout requests and history
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Status
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                            All
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
                            Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                            Processing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredEarnings.filter(e => e.status === 'paid').length > 0 ? (
                    <div className="space-y-4">
                      {filteredEarnings
                        .filter(e => e.status === 'paid')
                        .map((earning) => (
                          <div
                            key={earning.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                <CreditCard className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  Payout - {earning.course?.title || 'Multiple Courses'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Paid on {earning.payoutDate ? formatDate(earning.payoutDate) : formatDate(earning.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold">
                                  {formatCurrency(earning.amount)}
                                </p>
                                {getStatusBadge(earning.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No payouts found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Transactions</CardTitle>
                      <CardDescription>
                        View all your earnings transactions
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by course..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Status
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                            All
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
                            Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                            Processing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredEarnings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEarnings.map((earning) => (
                        <div
                          key={earning.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {earning.course?.title || 'Unknown Course'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Transaction ID: {earning.id.slice(0, 8)}... • {formatDateTime(earning.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold">
                                {formatCurrency(earning.amount)}
                              </p>
                              {getStatusBadge(earning.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination - only show on transactions tab */}
              {activeTab === 'transactions' && !loading && filteredEarnings.length > 0 && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

