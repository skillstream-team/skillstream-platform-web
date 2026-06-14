import * as Sentry from '@sentry/react';

interface ErrorContext {
  componentStack?: string;
  metadata?: Record<string, string | number | boolean>;
}

export const reportError = (error: unknown, context?: ErrorContext): void => {
  Sentry.captureException(error, {
    contexts: {
      react: { componentStack: context?.componentStack || '' },
    },
    extra: context?.metadata || {},
  });

  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error', error, context);
  }
};
