import * as React from "react"
import { 
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Calendar,
  DollarSign,
  MessageSquare,
  Star,
  Settings2,
  Users,
  Plus,
  List,
  FileText,
  CreditCard,
  Bell,
  Award,
  BarChart3,
  Target,
  Download,
  AlertCircle,
  FolderTree,
  Tags,
  Activity,
  Ticket,
} from "lucide-react"
import { useLocation } from "react-router-dom"
import { getCurrentUser, isTeacher, isAdmin } from "@/api/auth-utils"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(getCurrentUser())
  const location = useLocation()
  const currentPath = location.pathname
  
  // Check user roles
  const userIsAdmin = isAdmin()
  const userIsTeacher = isTeacher()
  const isAdminMode = userIsAdmin
  const isTeacherMode = userIsTeacher && !userIsAdmin
  
  // Update user on mount and when localStorage changes
  React.useEffect(() => {
    const updateUser = () => {
      setUser(getCurrentUser())
    }
    
    updateUser()
    
    // Listen for storage changes (e.g., when user logs in/out in another tab)
    window.addEventListener('storage', updateUser)
    
    return () => {
      window.removeEventListener('storage', updateUser)
    }
  }, [])
  
  const navMain = isAdminMode ? [
    // Admin navigation
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: currentPath === '/admin' || currentPath === '/',
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
      isActive: currentPath.startsWith('/admin/users'),
    },
    {
      title: "Course Moderation",
      url: "/admin/courses",
      icon: BookOpen,
      isActive: currentPath.startsWith('/admin/courses'),
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: FolderTree,
      isActive: currentPath.startsWith('/admin/categories'),
    },
    {
      title: "Tags",
      url: "/admin/tags",
      icon: Tags,
      isActive: currentPath.startsWith('/admin/tags'),
    },
    {
      title: "Payouts",
      url: "/admin/payouts",
      icon: CreditCard,
      isActive: currentPath.startsWith('/admin/payouts'),
    },
    {
      title: "Bulk Operations",
      url: "/admin/bulk",
      icon: List,
      isActive: currentPath.startsWith('/admin/bulk'),
    },
    {
      title: "Broadcasts",
      url: "/admin/broadcasts",
      icon: Bell,
      isActive: currentPath.startsWith('/admin/broadcasts'),
    },
    {
      title: "Activity Logs",
      url: "/admin/logs",
      icon: Activity,
      isActive: currentPath.startsWith('/admin/logs'),
    },
    {
      title: "User Import/Export",
      url: "/admin/user-import",
      icon: Download,
      isActive: currentPath.startsWith('/admin/user-import'),
    },
    {
      title: "Coupons",
      url: "/admin/coupons",
      icon: Ticket,
      isActive: currentPath.startsWith('/admin/coupons'),
    },
    {
      title: "Reviews",
      url: "/admin/reviews",
      icon: Star,
      isActive: currentPath.startsWith('/admin/reviews'),
    },
    {
      title: "Certificates",
      url: "/admin/certificates",
      icon: Award,
      isActive: currentPath.startsWith('/admin/certificates'),
    },
    {
      title: "Announcements",
      url: "/admin/announcements",
      icon: Bell,
      isActive: currentPath.startsWith('/admin/announcements'),
    },
    {
      title: "Content Reports",
      url: "/admin/reports",
      icon: AlertCircle,
      isActive: currentPath.startsWith('/admin/reports'),
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
      isActive: currentPath.startsWith('/admin/analytics'),
    },
    {
      title: "System Settings",
      url: "/admin/settings",
      icon: Settings2,
      isActive: currentPath.startsWith('/admin/settings'),
    },
    {
      title: "Import Courses",
      url: "/courses/import",
      icon: Download,
      isActive: currentPath === '/courses/import',
    },
  ] : isTeacherMode ? [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: currentPath === '/',
    },
    {
      title: "Courses",
      url: "/courses",
      icon: BookOpen,
      isActive: currentPath.startsWith('/courses'),
    },
    {
      title: "Students",
      url: "/students",
      icon: Users,
      isActive: currentPath.startsWith('/students'),
    },
    {
      title: "Lessons",
      url: "/lessons/upcoming",
      icon: Calendar,
      isActive: currentPath.startsWith('/lessons'),
    },
    {
      title: "Earnings",
      url: "/earnings",
      icon: DollarSign,
      isActive: currentPath.startsWith('/earnings'),
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
      isActive: currentPath.startsWith('/messages'),
    },
    {
      title: "Reviews",
      url: "/reviews",
      icon: Star,
      isActive: currentPath.startsWith('/reviews'),
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      isActive: currentPath.startsWith('/settings'),
    },
  ] : [
    // Student navigation
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: currentPath === '/',
    },
    {
      title: "My Courses",
      url: "/my-courses",
      icon: BookOpen,
      isActive: currentPath.startsWith('/my-courses'),
      items: [
        {
          title: "Enrolled",
          url: "/my-courses",
        },
        {
          title: "In Progress",
          url: "/my-courses/in-progress",
        },
        {
          title: "Completed",
          url: "/my-courses/completed",
        },
      ],
    },
    {
      title: "Browse Courses",
      url: "/courses",
      icon: GraduationCap,
      isActive: currentPath === '/courses' && !currentPath.startsWith('/my-courses'),
    },
    {
      title: "Learning Paths",
      url: "/learning-paths",
      icon: GraduationCap,
      isActive: currentPath.startsWith('/learning-paths'),
    },
    {
      title: "My Certificates",
      url: "/certificates",
      icon: Award,
      isActive: currentPath.startsWith('/certificates'),
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      isActive: currentPath.startsWith('/analytics'),
    },
    {
      title: "Study Goals",
      url: "/goals",
      icon: Target,
      isActive: currentPath.startsWith('/goals'),
    },
    {
      title: "Lessons",
      url: "/lessons/upcoming",
      icon: Calendar,
      isActive: currentPath.startsWith('/lessons'),
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
      isActive: currentPath.startsWith('/messages'),
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      isActive: currentPath.startsWith('/settings'),
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Account",
          url: "/settings/account",
        },
        {
          title: "Notifications",
          url: "/settings/notifications",
        },
      ],
    },
  ]

  const userData = {
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || 'User',
    email: user?.email || '',
    avatar: user?.avatar || '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center px-2 py-3">
          <h1 className="text-2xl font-extrabold tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Skill
            </span>
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Stream
            </span>
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

