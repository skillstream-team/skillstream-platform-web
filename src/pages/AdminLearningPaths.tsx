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
  Target,
  Plus,
  Info
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminLearningPaths() {
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
                <BreadcrumbPage>Learning Paths Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Learning Paths Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage structured learning paths
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Learning Path
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Enhanced Admin Features</AlertTitle>
            <AlertDescription>
              Learning paths can be created and managed through the existing LearningPathsAPI. 
              This admin page can be enhanced to provide bulk management, approval workflows, 
              and analytics specific to learning paths.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>
                Manage structured learning paths for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Learning Paths Management</p>
                <p>Use the existing Learning Paths feature to create and manage paths. 
                  This admin interface can be enhanced with additional management features.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

