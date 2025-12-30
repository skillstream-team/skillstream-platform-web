import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useSystemSettings } from "@/contexts/SystemSettingsContext"

export function MaintenanceModeBanner() {
  const { settings } = useSystemSettings()

  if (!settings?.maintenanceMode) {
    return null
  }

  return (
    <Alert variant="destructive" className="m-4 border-orange-500 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">Maintenance Mode</AlertTitle>
      <AlertDescription className="text-orange-800">
        {settings.maintenanceMessage || "The platform is currently under maintenance. We'll be back shortly."}
      </AlertDescription>
    </Alert>
  )
}

