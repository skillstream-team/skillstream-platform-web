import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export type ErrorBannerType = "error" | "success" | "warning" | "info"

export interface ErrorBannerProps {
  message: string
  title?: string
  type?: ErrorBannerType
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  className?: string
}

export function ErrorBanner({
  message,
  title,
  type = "error",
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  className,
}: ErrorBannerProps) {
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, autoDismissDelay, onDismiss])

  const icons = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  }

  const variants = {
    error: "destructive",
    success: "default",
    warning: "default",
    info: "default",
  }

  const Icon = icons[type]

  return (
    <Alert
      variant={variants[type] as any}
      className={cn(
        "mb-4 border-l-4",
        type === "error" && "border-l-destructive bg-destructive/10",
        type === "success" && "border-l-green-500 bg-green-50 dark:bg-green-950",
        type === "warning" && "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950",
        type === "info" && "border-l-blue-500 bg-blue-50 dark:bg-blue-950",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Icon
            className={cn(
              "h-5 w-5 mt-0.5 flex-shrink-0",
              type === "error" && "text-destructive",
              type === "success" && "text-green-600 dark:text-green-400",
              type === "warning" && "text-yellow-600 dark:text-yellow-400",
              type === "info" && "text-blue-600 dark:text-blue-400"
            )}
          />
          <div className="flex-1">
            {title && (
              <AlertTitle className="mb-1 font-semibold">{title}</AlertTitle>
            )}
            <AlertDescription className="text-sm leading-relaxed">
              {message}
            </AlertDescription>
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

