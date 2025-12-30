import { useError } from "@/contexts/ErrorContext"
import { toast } from "sonner"
import { ErrorBannerType } from "@/components/ErrorBanner"

/**
 * Hook for displaying errors with better UX
 * Prefers error banner over toast for errors
 */
export function useErrorDisplay() {
  const { showError: showBannerError } = useError()

  const showError = (
    message: string,
    title?: string,
    options?: {
      useBanner?: boolean
      type?: ErrorBannerType
    }
  ) => {
    if (options?.useBanner !== false) {
      // Use error banner for better visibility
      showBannerError(message, title, options?.type || "error")
    } else {
      // Fallback to toast if banner is explicitly disabled
      toast.error(message, {
        title: title || "Error",
        duration: 5000,
      })
    }
  }

  const showSuccess = (message: string, title?: string) => {
    toast.success(message, {
      title: title || "Success",
      duration: 3000,
    })
  }

  const showWarning = (message: string, title?: string) => {
    toast.warning(message, {
      title: title || "Warning",
      duration: 4000,
    })
  }

  const showInfo = (message: string, title?: string) => {
    toast.info(message, {
      title: title || "Info",
      duration: 4000,
    })
  }

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  }
}

