interface ErrorContext {
  componentStack?: string;
  metadata?: Record<string, string | number | boolean>;
}

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, options?: Record<string, unknown>) => void;
    };
  }
}

export const reportError = (error: unknown, context?: ErrorContext): void => {
  if (typeof window !== 'undefined' && window.Sentry?.captureException) {
    window.Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: context?.componentStack || '',
        },
      },
      extra: context?.metadata || {},
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // Keep this visible in development if no telemetry provider is mounted.
    console.error('Unhandled error', error, context);
  }
};
