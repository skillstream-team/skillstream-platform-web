// CSS is processed separately and loaded via <link> in index.html
import * as Sentry from '@sentry/react';
import ReactDOM from 'react-dom/client';
import App from './App';

const dsn = process.env.REACT_APP_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Capture 100% of errors; sample traces at 10% to stay in free tier
    tracesSampleRate: 0.1,
    // Session replays only on errors, 10% of normal sessions
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
  });
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  Sentry.captureException(error);
  console.error('Main.tsx: Failed to render app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const msg = error instanceof Error ? error.message : String(error);
    const pre = document.createElement('pre');
    pre.textContent = msg;
    pre.style.cssText = 'background:#f5f5f5;padding:10px;border-radius:4px;overflow:auto';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding:20px;font-family:sans-serif';
    wrapper.innerHTML = '<h1>Application Error</h1><p>Failed to load the application. Please check the console for details.</p>';
    wrapper.appendChild(pre);
    rootElement.appendChild(wrapper);
  }
}
