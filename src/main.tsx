import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { pushNotificationService } from './services/pushNotifications'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  pushNotificationService.registerServiceWorker().catch((error) => {
    console.warn('[Main] Failed to register service worker:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
