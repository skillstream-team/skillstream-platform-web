import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { ErrorBanner, ErrorBannerType } from "@/components/ErrorBanner"

interface ErrorState {
  message: string
  title?: string
  type: ErrorBannerType
  id: string
}

interface ErrorContextType {
  showError: (message: string, title?: string, type?: ErrorBannerType) => void
  clearError: () => void
  currentError: ErrorState | null
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [currentError, setCurrentError] = useState<ErrorState | null>(null)

  const showError = useCallback(
    (message: string, title?: string, type: ErrorBannerType = "error") => {
      setCurrentError({
        message,
        title,
        type,
        id: Date.now().toString(),
      })
    },
    []
  )

  const clearError = useCallback(() => {
    setCurrentError(null)
  }, [])

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError }}>
      {children}
      {currentError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <ErrorBanner
            message={currentError.message}
            title={currentError.title}
            type={currentError.type}
            onDismiss={clearError}
            autoDismiss={currentError.type !== "error"}
            autoDismissDelay={currentError.type === "error" ? 10000 : 5000}
          />
        </div>
      )}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error("useError must be used within ErrorProvider")
  }
  return context
}

