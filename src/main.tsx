// CSS is processed separately and loaded via <link> in index.html
import ReactDOM from 'react-dom/client';
import App from './App';

// Add error handling for initial render
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Main.tsx: Failed to render app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please check the console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <p style="margin-top: 20px; color: #666;">Check the browser console for more details.</p>
      </div>
    `;
  }
}

