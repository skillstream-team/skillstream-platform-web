import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:min-w-[400px]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-destructive group-[.toaster]:bg-destructive/10",
          success: "group-[.toaster]:border-green-500 group-[.toaster]:bg-green-50 dark:group-[.toaster]:bg-green-950",
          warning: "group-[.toaster]:border-yellow-500 group-[.toaster]:bg-yellow-50 dark:group-[.toaster]:bg-yellow-950",
          info: "group-[.toaster]:border-blue-500 group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-950",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

