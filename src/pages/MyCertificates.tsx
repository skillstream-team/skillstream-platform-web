import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { 
  Award,
  Download,
  Calendar,
  BookOpen,
  Filter,
  Search,
  Share2
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/api/auth-utils"
import { CertificatesAPI, Certificate } from "@/api/certificates.api"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function MyCertificates() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'course'>('newest')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchCertificates()
  }, [])

  useEffect(() => {
    filterAndSortCertificates()
  }, [certificates, searchQuery, sortBy])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      // TODO: Implement getCertificates API endpoint
      // For now, return empty array
      const certs: any[] = []
      const certsArray = Array.isArray(certs) ? certs : []
      setCertificates(certsArray)
    } catch (error: any) {
      console.error('Failed to fetch certificates:', error)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load certificates')
      }
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCertificates = () => {
    let filtered = [...certificates]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cert =>
        cert.course?.title?.toLowerCase().includes(query) ||
        cert.certificateNumber?.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
        case 'oldest':
          return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime()
        case 'course':
          return (a.course?.title || '').localeCompare(b.course?.title || '')
        default:
          return 0
      }
    })

    setFilteredCertificates(filtered)
  }

  const handleDownload = async (certificate: Certificate) => {
    try {
      const blob = await CertificatesAPI.downloadCertificate(certificate.courseId, certificate.userId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificate.certificateNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Certificate downloaded successfully')
    } catch (error: any) {
      console.error('Failed to download certificate:', error)
      toast.error('Failed to download certificate')
    }
  }
  
  const handleShare = async (certificate: Certificate) => {
    const url = `${window.location.origin}/certificates/${certificate.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Certificate link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareToTwitter = (certificate: Certificate) => {
    const url = `${window.location.origin}/certificates/${certificate.id}`
    const text = `I just completed "${certificate.course?.title}"! Check out my certificate.`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const handleShareToLinkedIn = (certificate: Certificate) => {
    const url = `${window.location.origin}/certificates/${certificate.id}`
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedInUrl, '_blank', 'width=550,height=420')
  }

  const handleShareToFacebook = (certificate: Certificate) => {
    const url = `${window.location.origin}/certificates/${certificate.id}`
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank', 'width=550,height=420')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Certificates</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">My Certificates</h1>
                <p className="text-lg text-muted-foreground">
                  View and download your course completion certificates
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search certificates by course name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="course">Sort by Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Certificates Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCertificates.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCertificates.map((certificate) => (
                <Card 
                  key={certificate.id} 
                  className="overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Award className="h-8 w-8 text-yellow-600" />
                      </div>
                      <Badge variant="outline" className="bg-white">
                        Verified
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {certificate.course?.title || 'Course Certificate'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Certificate No: {certificate.certificateNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Issued {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleDownload(certificate)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShare(certificate)}
                        title="Share certificate"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      {certificate.course?.id && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/courses/${certificate.course.id}`)}
                          title="View course"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-16">
              <CardContent className="text-center">
                <Award className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-2xl font-semibold mb-3">
                  {searchQuery ? 'No certificates found' : 'No certificates yet'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Complete courses to earn certificates. Your certificates will appear here once you finish a course.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {certificates.length > 0 && (
            <div className="mt-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{certificates.length}</div>
                      <div className="text-sm text-muted-foreground mt-1">Total Certificates</div>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {new Set(certificates.map(c => c.courseId)).size}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Different Courses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

