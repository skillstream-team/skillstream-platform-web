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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Settings2,
  Save,
  Mail,
  DollarSign,
  Shield,
  Globe,
  Bell,
  Database,
  Server
} from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import { AdminAPI } from "@/api/admin.api"
import { isAdmin } from "@/api/auth-utils"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"

export function AdminSettings() {
  const navigate = useNavigate()
  const { refreshSettings } = useSystemSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({
    // General
    platformName: 'SkillStream',
    platformDescription: '',
    supportEmail: '',
    contactEmail: '',
    
    // Features
    allowCourseCreation: true,
    requireCourseApproval: true,
    allowPublicRegistration: true,
    enableReviews: true,
    enableForums: true,
    
    // Payments
    platformFee: 10,
    minimumPayout: 50,
    payoutSchedule: 'weekly',
    
    // Security
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: 30,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await AdminAPI.getSystemSettings()
      if (data) {
        setSettings(data)
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load settings')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await AdminAPI.updateSystemSettings(settings)
      toast.success('Settings saved successfully')
      // Refresh settings context so changes are reflected throughout the app
      await refreshSettings()
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error(error?.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
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
                <BreadcrumbPage>System Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure platform-wide settings and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="features">
                <Settings2 className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Server className="h-4 w-4 mr-2" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic platform information and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={settings.platformName}
                      onChange={(e) => updateSetting('platformName', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformDescription">Platform Description</Label>
                    <Textarea
                      id="platformDescription"
                      value={settings.platformDescription}
                      onChange={(e) => updateSetting('platformDescription', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => updateSetting('supportEmail', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => updateSetting('contactEmail', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Settings */}
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>
                    Enable or disable platform features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Course Creation</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow teachers to create new courses
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowCourseCreation}
                      onCheckedChange={(checked) => updateSetting('allowCourseCreation', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Course Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Courses must be approved by admin before going live
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireCourseApproval}
                      onCheckedChange={(checked) => updateSetting('requireCourseApproval', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Public Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowPublicRegistration}
                      onCheckedChange={(checked) => updateSetting('allowPublicRegistration', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Reviews</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow students to review courses
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableReviews}
                      onCheckedChange={(checked) => updateSetting('enableReviews', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Forums</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable course discussion forums
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableForums}
                      onCheckedChange={(checked) => updateSetting('enableForums', checked)}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Settings */}
            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>
                    Configure payment and revenue sharing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformFee">Platform Fee (%)</Label>
                    <Input
                      id="platformFee"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.platformFee}
                      onChange={(e) => updateSetting('platformFee', parseFloat(e.target.value))}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of course sales that goes to the platform
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPayout">Minimum Payout ($)</Label>
                    <Input
                      id="minimumPayout"
                      type="number"
                      min="0"
                      value={settings.minimumPayout}
                      onChange={(e) => updateSetting('minimumPayout', parseFloat(e.target.value))}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum amount required before teacher payout
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <Select
                      value={settings.payoutSchedule}
                      onValueChange={(value) => updateSetting('payoutSchedule', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="payoutSchedule">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and authentication options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify their email before accessing the platform
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to enable 2FA for their accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableTwoFactor}
                      onCheckedChange={(checked) => updateSetting('enableTwoFactor', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time before user session expires due to inactivity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure platform notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable email notifications for platform events
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                      disabled={loading}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Settings */}
            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>
                    Put the platform in maintenance mode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Disable public access to the platform
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                      disabled={loading}
                    />
                  </div>
                  {settings.maintenanceMode && (
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={settings.maintenanceMessage}
                        onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                        disabled={loading}
                        placeholder="We're currently performing maintenance. We'll be back shortly..."
                        rows={4}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

