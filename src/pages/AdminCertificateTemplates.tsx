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
  Award,
  Plus,
  AlertCircle,
  Info
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminCertificateTemplates() {
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
                <BreadcrumbPage>Certificate Templates</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Certificate Templates</h1>
              <p className="text-muted-foreground mt-1">
                Manage certificate templates and designs
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Backend Implementation Required</AlertTitle>
            <AlertDescription>
              This feature requires backend API endpoints to be implemented. 
              Please refer to BACKEND_REQUIREMENTS.md for the required endpoints:
              GET/POST/PUT/DELETE /admin/certificate-templates
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Templates</CardTitle>
              <CardDescription>
                Design and manage certificate templates for course completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Certificate Templates Management</p>
                <p>Backend API endpoints need to be implemented to enable this feature.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

