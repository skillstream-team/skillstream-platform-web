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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2,
  Send,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminAPI } from "@/api/admin.api"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminEmailTemplates() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: [] as string[],
    type: '',
    isActive: true,
  })
  
  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchTemplates()
    }
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getEmailTemplates()
      setTemplates(response.templates || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTemplate(null)
    setIsEditing(false)
    setFormData({
      name: '',
      subject: '',
      body: '',
      variables: [],
      type: '',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsEditing(true)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      type: template.type,
      isActive: template.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setTestEmail('')
    setTestVariables({})
    // Initialize test variables from template variables
    const vars: Record<string, string> = {}
    template.variables?.forEach(v => {
      const varName = v.replace(/[{}]/g, '')
      vars[varName] = ''
    })
    setTestVariables(vars)
    setTestDialogOpen(true)
  }

  // Extract variables from template body ({{variableName}})
  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables = new Set<string>()
    let match
    while ((match = variableRegex.exec(text)) !== null) {
      variables.add(`{{${match[1]}}}`)
    }
    return Array.from(variables)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.subject || !formData.body || !formData.type) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      // Extract variables from body and subject
      const bodyVariables = extractVariables(formData.body)
      const subjectVariables = extractVariables(formData.subject)
      const allVariables = Array.from(new Set([...bodyVariables, ...subjectVariables]))
      
      if (isEditing && selectedTemplate) {
        await AdminAPI.updateEmailTemplate(selectedTemplate.id, {
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          isActive: formData.isActive,
        })
        toast.success('Email template updated successfully')
      } else {
        await AdminAPI.createEmailTemplate({
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          variables: allVariables,
          type: formData.type,
          isActive: formData.isActive,
        })
        toast.success('Email template created successfully')
      }
      setDialogOpen(false)
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save email template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return

    try {
      await AdminAPI.deleteEmailTemplate(selectedTemplate.id)
      toast.success('Email template deleted successfully')
      setDeleteDialogOpen(false)
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete email template')
    }
  }

  const handleTestSubmit = async () => {
    if (!testEmail || !selectedTemplate) {
      toast.error('Please enter a test email address')
      return
    }

    try {
      setIsTesting(true)
      await AdminAPI.testEmailTemplate(selectedTemplate.id, {
        testEmail,
        variables: testVariables,
      })
      toast.success('Test email sent successfully')
      setTestDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email')
    } finally {
      setIsTesting(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.subject.toLowerCase().includes(query) ||
      template.type.toLowerCase().includes(query)
    )
  })

  const templateTypes = [
    'WELCOME',
    'COURSE_ENROLLMENT',
    'PAYMENT_RECEIPT',
    'PASSWORD_RESET',
    'COURSE_COMPLETION',
    'CERTIFICATE_ISSUED',
    'PAYOUT_NOTIFICATION',
    'COURSE_APPROVED',
    'COURSE_REJECTED',
    'SYSTEM_NOTIFICATION',
  ]

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
                <BreadcrumbPage>Email Templates</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Templates</h1>
              <p className="text-muted-foreground mt-1">
                Manage email templates for system notifications
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Manage templates for welcome emails, password resets, course completion, etc.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
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
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No email templates found</p>
                  <p>Create your first email template to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.variables?.slice(0, 3).map((v, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {v}
                              </Badge>
                            ))}
                            {template.variables && template.variables.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTest(template)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Email Template' : 'Create Email Template'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update the email template details' : 'Create a new email template for system notifications'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome to SkillStream!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Email Body *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Email body content. Use {{variableName}} for variables."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {'{{userName}}'}, {'{{courseName}}'}, etc. in your template.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Test Email Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Email Template</DialogTitle>
              <DialogDescription>
                Send a test email to verify the template works correctly
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address *</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Template Variables</Label>
                  <div className="space-y-2">
                    {selectedTemplate.variables.map((v) => {
                      const varName = v.replace(/[{}]/g, '')
                      return (
                        <div key={v} className="space-y-1">
                          <Label htmlFor={varName} className="text-sm">{v}</Label>
                          <Input
                            id={varName}
                            value={testVariables[varName] || ''}
                            onChange={(e) => setTestVariables({ ...testVariables, [varName]: e.target.value })}
                            placeholder={`Enter value for ${varName}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTestSubmit} disabled={isTesting || !testEmail}>
                {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Test Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
