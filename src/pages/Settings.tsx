import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link, useSearchParams } from "react-router-dom"
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
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  User,
  Mail,
  Lock,
  Bell,
  CreditCard,
  Camera,
  Save,
  Globe,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ChevronDown
} from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentUser, isStudent, isTeacher } from "@/api/auth-utils"
import { toast } from "sonner"
import { UsersAPI } from "@/api/users.api"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Loader2, Shield } from "lucide-react"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

type SettingsTab = 'profile' | 'account' | 'notifications' | 'billing'

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings } = useSystemSettings()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Push notifications hook
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications()

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    occupation: '',
  })

  // Account form state
  const [accountData, setAccountData] = useState({
    email: currentUser?.email || '',
    username: currentUser?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notifications state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    courseUpdates: true,
    newMessages: true,
    earningsUpdates: isTeacher() ? true : false, // Only for teachers
    marketingEmails: false,
    announcementNotifications: isStudent() ? true : false, // Only for students
    certificateNotifications: isStudent() ? true : false, // Only for students
  })

  // Billing state
  const [billingData, setBillingData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  })

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab
    if (tab && ['profile', 'account', 'notifications', 'billing'].includes(tab)) {
      setActiveTab(tab)
    }
    fetchSettings()
  }, [searchParams])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Fetch profile
      const profile = await UsersAPI.getProfile()
      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        phone: profile.phone || '',
        occupation: profile.occupation || '',
      })
      setAccountData(prev => ({
        ...prev,
        email: profile.email || '',
        username: profile.username || '',
      }))

      // Fetch notification settings
      const notifications = await UsersAPI.getNotificationSettings()
      setNotificationSettings(notifications as any)

      // Fetch billing info
      const billing = await UsersAPI.getBillingInfo()
      setBillingData({
        cardNumber: billing.cardNumber || '',
        cardHolder: billing.cardHolderName || '',
        expiryDate: billing.expiryDate || '',
        cvv: billing.cvv || '',
        billingAddress: billing.street || '',
        city: billing.city || '',
        state: billing.state || '',
        zipCode: billing.zip || '',
        country: billing.country || 'US',
      })
    } catch (error: any) {
      // If API fails, use current user data (for development)
      console.warn('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      await UsersAPI.updateProfile(profileData)
      setCurrentUser(getCurrentUser()) // Refresh user data
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error(error?.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAccountSave = async () => {
    if (accountData.newPassword && accountData.newPassword !== accountData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      const payload: any = {}
      if (accountData.email) payload.email = accountData.email
      if (accountData.username) payload.username = accountData.username
      if (accountData.newPassword) {
        payload.currentPassword = accountData.currentPassword
        payload.newPassword = accountData.newPassword
      }
      
      await UsersAPI.updateAccount(payload)
      setCurrentUser(getCurrentUser()) // Refresh user data
      toast.success('Account updated successfully')
      setAccountData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (error: any) {
      console.error('Failed to update account:', error)
      toast.error(error?.response?.data?.message || 'Failed to update account. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSave = async () => {
    setSaving(true)
    try {
      // Update notification settings
      await UsersAPI.updateNotificationSettings(notificationSettings as any)
      
      // Handle push notification subscription/unsubscription
      if (pushSupported) {
        if (notificationSettings.pushNotifications && !pushSubscribed) {
          // User wants push notifications but isn't subscribed
          const subscribed = await subscribeToPush()
          if (!subscribed) {
            // If subscription failed, turn off the toggle
            setNotificationSettings(prev => ({ ...prev, pushNotifications: false }))
          }
        } else if (!notificationSettings.pushNotifications && pushSubscribed) {
          // User doesn't want push notifications but is subscribed
          await unsubscribeFromPush()
        }
      }
      
      toast.success('Notification settings updated successfully')
    } catch (error: any) {
      console.error('Failed to update notifications:', error)
      toast.error(error?.response?.data?.message || 'Failed to update notification settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  const handlePushNotificationToggle = async (enabled: boolean) => {
    setNotificationSettings(prev => ({ ...prev, pushNotifications: enabled }))
    
    if (enabled && pushSupported) {
      if (pushPermission !== 'granted') {
        // Permission not granted, try to request it
        const subscribed = await subscribeToPush()
        if (!subscribed) {
          setNotificationSettings(prev => ({ ...prev, pushNotifications: false }))
        }
      } else if (!pushSubscribed) {
        // Permission granted but not subscribed
        await subscribeToPush()
      }
    } else if (!enabled && pushSubscribed) {
      // Unsubscribe
      await unsubscribeFromPush()
    }
  }

  const handleBillingSave = async () => {
    setSaving(true)
    try {
      await UsersAPI.updateBillingInfo({
        cardNumber: billingData.cardNumber,
        cardHolderName: billingData.cardHolder,
        expiryDate: billingData.expiryDate,
        cvv: billingData.cvv,
        street: billingData.billingAddress,
        city: billingData.city,
        state: billingData.state,
        zip: billingData.zipCode,
        country: billingData.country,
      })
      toast.success('Billing information updated successfully')
    } catch (error: any) {
      console.error('Failed to update billing:', error)
      toast.error(error?.response?.data?.message || 'Failed to update billing information. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getUserInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    return currentUser?.username?.substring(0, 2).toUpperCase() || 'U'
  }

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'account' as SettingsTab, label: 'Account', icon: Lock },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'billing' as SettingsTab, label: 'Billing', icon: CreditCard },
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
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and public details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                  <textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="occupation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Occupation
                    </label>
                    <Input
                      id="occupation"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Update your account credentials and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                  <Input
                    id="username"
                    value={accountData.username}
                    onChange={(e) => setAccountData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="johndoe"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Current Password</label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={accountData.currentPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">New Password</label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={accountData.newPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm New Password</label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Separator />

                {settings?.requireEmailVerification && (
                  <>
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/50">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        Email verification is required. Please verify your email address to access all platform features.
                      </AlertDescription>
                    </Alert>
                    <Separator />
                  </>
                )}

                {settings?.enableTwoFactor && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Two-Factor Authentication
                      </h3>
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          Two-factor authentication is available for your account. Enable it to add an extra layer of security.
                        </AlertDescription>
                      </Alert>
                      <Button variant="outline" disabled>
                        <Shield className="h-4 w-4 mr-2" />
                        Enable Two-Factor Authentication
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication is enabled for your platform. Contact support if you need help setting it up.
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {settings?.sessionTimeout && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Session Timeout</label>
                      <p className="text-sm text-muted-foreground">
                        Your session will expire after {settings.sessionTimeout} minutes of inactivity.
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleAccountSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Push Notifications
                        {pushLoading && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {pushSupported 
                          ? pushPermission === 'granted' 
                            ? pushSubscribed 
                              ? 'Receive push notifications in your browser (subscribed)'
                              : 'Receive push notifications in your browser (click to subscribe)'
                            : pushPermission === 'denied'
                            ? 'Push notifications are blocked. Please enable them in your browser settings.'
                            : 'Receive push notifications in your browser'
                          : 'Push notifications are not supported in this browser'
                        }
                      </p>
                      {pushSupported && pushPermission !== 'granted' && pushPermission !== 'denied' && (
                        <p className="text-xs text-amber-600 mt-1">
                          You'll be prompted to allow notifications when you enable this option
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={pushSupported && notificationSettings.pushNotifications && pushSubscribed}
                      onChange={(e) => handlePushNotificationToggle(e.target.checked)}
                      disabled={!pushSupported || pushLoading || pushPermission === 'denied'}
                      className="h-4 w-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">SMS Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Course Updates</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about course updates and new content
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.courseUpdates}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, courseUpdates: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">New Messages</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive new messages
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.newMessages}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, newMessages: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <Separator />

                  {isTeacher() && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Earnings Updates</label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about earnings and payout updates
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.earningsUpdates}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, earningsUpdates: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                      <Separator />
                    </>
                  )}

                  {isStudent() && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Announcement Notifications</label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when instructors post new announcements
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.announcementNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, announcementNotifications: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Certificate Notifications</label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you earn a new certificate
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.certificateNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, certificateNotifications: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>

                      <Separator />
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Marketing Emails</label>
                      <p className="text-sm text-muted-foreground">
                        Receive marketing emails and promotional content
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleNotificationsSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Method</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="cardNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Card Number</label>
                    <Input
                      id="cardNumber"
                      value={billingData.cardNumber}
                      onChange={(e) => setBillingData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cardHolder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Card Holder Name</label>
                    <Input
                      id="cardHolder"
                      value={billingData.cardHolder}
                      onChange={(e) => setBillingData(prev => ({ ...prev, cardHolder: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="expiryDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Expiry Date</label>
                      <Input
                        id="expiryDate"
                        value={billingData.expiryDate}
                        onChange={(e) => setBillingData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cvv" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">CVV</label>
                      <Input
                        id="cvv"
                        type="password"
                        value={billingData.cvv}
                        onChange={(e) => setBillingData(prev => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing Address</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="billingAddress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Street Address</label>
                    <Input
                      id="billingAddress"
                      value={billingData.billingAddress}
                      onChange={(e) => setBillingData(prev => ({ ...prev, billingAddress: e.target.value }))}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">City</label>
                      <Input
                        id="city"
                        value={billingData.city}
                        onChange={(e) => setBillingData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="state" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">State</label>
                      <Input
                        id="state"
                        value={billingData.state}
                        onChange={(e) => setBillingData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="zipCode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Zip Code</label>
                      <Input
                        id="zipCode"
                        value={billingData.zipCode}
                        onChange={(e) => setBillingData(prev => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="10001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Country</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            {billingData.country === 'US' && 'United States'}
                            {billingData.country === 'CA' && 'Canada'}
                            {billingData.country === 'UK' && 'United Kingdom'}
                            {billingData.country === 'AU' && 'Australia'}
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setBillingData(prev => ({ ...prev, country: 'US' }))}>
                            United States
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBillingData(prev => ({ ...prev, country: 'CA' }))}>
                            Canada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBillingData(prev => ({ ...prev, country: 'UK' }))}>
                            United Kingdom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBillingData(prev => ({ ...prev, country: 'AU' }))}>
                            Australia
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleBillingSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

