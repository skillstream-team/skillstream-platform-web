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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Award,
  Search,
  Download,
  MoreVertical,
  Ban,
  Loader2,
  Calendar,
  User,
  BookOpen
} from "lucide-react"
import { useEffect, useState } from "react"
import { AdminAPI } from "@/api/admin.api"
import { CertificatesAPI, Certificate } from "@/api/certificates.api"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { Pagination as PaginationType } from "@/api/types"

export function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [revokeReason, setRevokeReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchCertificates()
  }, [pagination.page, courseFilter])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      // Try admin API first, fallback to CertificatesAPI if not available
      try {
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
        }
        if (courseFilter !== "all") {
          params.courseId = courseFilter
        }
        const response = await AdminAPI.getAllCertificates(params)
        let filteredCertificates = response.certificates || []
        if (searchQuery) {
          filteredCertificates = filteredCertificates.filter((cert: Certificate) =>
            cert.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        setCertificates(filteredCertificates)
        setPagination(response.pagination || pagination)
      } catch (error: any) {
        // Fallback to regular CertificatesAPI (will get user's own certificates)
        if (error?.response?.status === 404) {
          const response = await CertificatesAPI.getCertificates({})
          setCertificates(response || [])
        } else {
          throw error
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch certificates:", error)
      if (error?.response?.status !== 404) {
        toast.error("Failed to load certificates")
      }
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = (certificate: Certificate) => {
    setSelectedCertificate(certificate)
    setRevokeReason("")
    setIsRevokeDialogOpen(true)
  }

  const handleDownload = async (certificate: Certificate) => {
    try {
      const blob = await CertificatesAPI.downloadCertificate(certificate.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificate.certificateNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Certificate downloaded")
    } catch (error: any) {
      console.error("Failed to download certificate:", error)
      toast.error("Failed to download certificate")
    }
  }

  const confirmRevoke = async () => {
    if (!selectedCertificate) return
    setIsProcessing(true)
    try {
      await AdminAPI.revokeCertificate(selectedCertificate.id, revokeReason)
      toast.success("Certificate revoked successfully")
      setIsRevokeDialogOpen(false)
      setSelectedCertificate(null)
      setRevokeReason("")
      fetchCertificates()
    } catch (error: any) {
      console.error("Failed to revoke certificate:", error)
      if (error?.response?.status === 404) {
        toast.info("Certificate revocation API not yet implemented on backend")
      } else {
        toast.error(error?.response?.data?.message || "Failed to revoke certificate")
      }
    } finally {
      setIsProcessing(false)
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
                <BreadcrumbPage>Certificate Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all issued certificates
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email, course, or certificate number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="pl-8"
              />
            </div>
          </div>

          {/* Certificates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
              <CardDescription>
                All certificates issued in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No certificates found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((certificate) => (
                        <TableRow key={certificate.id}>
                          <TableCell className="font-mono text-sm">
                            {certificate.certificateNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={certificate.user?.avatar} />
                                <AvatarFallback>
                                  {certificate.user?.firstName?.[0] || certificate.user?.email?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {certificate.user?.firstName && certificate.user?.lastName
                                    ? `${certificate.user.firstName} ${certificate.user.lastName}`
                                    : certificate.user?.email || "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {certificate.user?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {certificate.course?.title || "Unknown Course"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(certificate.issuedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Valid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(certificate)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRevoke(certificate)}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Revoke
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) =>
                          setPagination(prev => ({ ...prev, page }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Revoke Dialog */}
          <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to revoke this certificate? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="revokeReason">Reason (Optional)</Label>
                <Textarea
                  id="revokeReason"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter reason for revocation..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmRevoke}
                  disabled={isProcessing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Revoke Certificate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

