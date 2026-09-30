import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent opaque cross-origin script errors (e.g. from third-party scripts or sandboxed iframes) from crashing the application
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      if (event.message === 'Script error.' || event.message?.includes('Script error')) {
        console.warn('[Global] Suppressed cross-origin Script error:', event);
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      if (reason && (reason === 'Script error.' || String(reason).includes('Script error'))) {
        console.warn('[Global] Suppressed unhandled rejection Script error:', reason);
        event.preventDefault();
      }
    },
    true
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
