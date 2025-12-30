import { toast } from "sonner"

/**
 * Better error handling utility
 * Use this instead of toast.error for better UX
 */

export interface ErrorDisplayOptions {
  useBanner?: boolean // Use error banner instead of toast
  title?: string
  duration?: number
}

/**
 * Display error using the error banner (better UX)
 * This should be used in most cases instead of toast.error
 */
export function showError(
  message: string,
  title?: string,
  options?: ErrorDisplayOptions
) {
  // If useBanner is true or not specified, we'll use the error context
  // For now, we'll use toast but with better styling
  // The ErrorContext will be used when components are updated
  toast.error(title ? `${title}: ${message}` : message, {
    duration: options?.duration || 5000,
    position: "top-center",
  })
}

/**
 * Display success message (keep using toast for success)
 */
export function showSuccess(message: string, title?: string) {
  toast.success(title ? `${title}: ${message}` : message, {
    duration: 3000,
    position: "top-center",
  })
}

/**
 * Display warning message
 */
export function showWarning(message: string, title?: string) {
  toast.warning(title ? `${title}: ${message}` : message, {
    duration: 4000,
    position: "top-center",
  })
}

/**
 * Display info message
 */
export function showInfo(message: string, title?: string) {
  toast.info(title ? `${title}: ${message}` : message, {
    duration: 4000,
    position: "top-center",
  })
}

