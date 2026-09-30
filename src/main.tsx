import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enhanced global error catching for 'Script error.' diagnosis
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Window Error:', {
    message,
    source,
    lineno,
    colno,
    stack: error?.stack
  });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise Rejection:', event.reason);
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  console.error('Bootstrap Error:', err);
}
