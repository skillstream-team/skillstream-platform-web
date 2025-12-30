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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Users, 
  Settings,
  TrendingUp,
  Loader2,
  DollarSign,
  UserCheck,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function AdminReferrals() {
  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    isEnabled: true,
    referrerReward: { type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: 10 },
    refereeReward: { type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: 5 },
    minPayout: 50,
    terms: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchSettings(),
        fetchStats(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true)
      const response = await AdminAPI.getReferralSettings()
      setSettings(response.data)
      setFormData({
        isEnabled: response.data.isEnabled ?? true,
        referrerReward: response.data.referrerReward || { type: 'PERCENTAGE', value: 10 },
        refereeReward: response.data.refereeReward || { type: 'PERCENTAGE', value: 5 },
        minPayout: response.data.minPayout || 50,
        terms: response.data.terms || '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch referral settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await AdminAPI.getReferralStats()
      setStats(response.data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch referral stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const handleOpenSettings = () => {
    setSettingsDialogOpen(true)
  }

  const handleSaveSettings = async () => {
    try {
      setIsSubmitting(true)
      await AdminAPI.updateReferralSettings(formData)
      toast.success('Referral settings updated successfully')
      setSettingsDialogOpen(false)
      fetchSettings()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update referral settings')
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
                <BreadcrumbPage>Referrals Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Referrals Management</h1>
              <p className="text-muted-foreground mt-1">
                View and manage referral program
              </p>
            </div>
            <Button onClick={handleOpenSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <Tabs defaultValue="stats" className="space-y-4">
            <TabsList>
              <TabsTrigger value="stats">
                <TrendingUp className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">{stats?.activeReferrers || 0}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Rewards Paid</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">
                        ${(stats?.totalRewardsPaid || 0).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">
                        ${(stats?.pendingRewards || 0).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {stats?.topReferrers && stats.topReferrers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Referrers</CardTitle>
                    <CardDescription>
                      Users with the most successful referrals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Referrals</TableHead>
                          <TableHead>Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topReferrers.map((referrer: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{referrer.name}</TableCell>
                            <TableCell>{referrer.referrals}</TableCell>
                            <TableCell>${referrer.earnings.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Settings</CardTitle>
                  <CardDescription>
                    View current referral program configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {settingsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : settings ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Program Enabled</Label>
                        <Badge variant={settings.isEnabled ? "default" : "secondary"}>
                          {settings.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Referrer Reward</Label>
                        <p className="text-sm text-muted-foreground">
                          {settings.referrerReward?.type === 'PERCENTAGE' ? '%' : '$'}
                          {settings.referrerReward?.value || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Referee Reward</Label>
                        <p className="text-sm text-muted-foreground">
                          {settings.refereeReward?.type === 'PERCENTAGE' ? '%' : '$'}
                          {settings.refereeReward?.value || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Minimum Payout</Label>
                        <p className="text-sm text-muted-foreground">${settings.minPayout || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No settings found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Referral Program Settings</DialogTitle>
              <DialogDescription>
                Configure referral program rewards and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
                <Label htmlFor="isEnabled">Enable Referral Program</Label>
              </div>

              <div className="space-y-2">
                <Label>Referrer Reward Type</Label>
                <Select
                  value={formData.referrerReward.type}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                    setFormData({
                      ...formData,
                      referrerReward: { ...formData.referrerReward, type: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Referrer Reward Value</Label>
                <Input
                  type="number"
                  value={formData.referrerReward.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referrerReward: { ...formData.referrerReward, value: parseFloat(e.target.value) || 0 },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Referee Reward Type</Label>
                <Select
                  value={formData.refereeReward.type}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                    setFormData({
                      ...formData,
                      refereeReward: { ...formData.refereeReward, type: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Referee Reward Value</Label>
                <Input
                  type="number"
                  value={formData.refereeReward.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      refereeReward: { ...formData.refereeReward, value: parseFloat(e.target.value) || 0 },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Payout</Label>
                <Input
                  type="number"
                  value={formData.minPayout}
                  onChange={(e) =>
                    setFormData({ ...formData, minPayout: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Referral program terms and conditions..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
