import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoutineProvider } from './context/RoutineContext';
import { AppProvider } from './context/AppContext';
import './index.css';
import { checkAndRegisterAppUpdate } from './utils/appUpdater';

checkAndRegisterAppUpdate();

window.onerror = (message, source, lineno, colno, error) => {
  const savedErrors = localStorage.getItem('overhaul_last_crashes');
  const errors = savedErrors ? JSON.parse(savedErrors) : [];
  errors.unshift({ timestamp: new Date().toISOString(), message: String(message), stack: error?.stack });
  localStorage.setItem('overhaul_last_crashes', JSON.stringify(errors.slice(0, 5)));
};

window.onunhandledrejection = (event) => {
  const savedErrors = localStorage.getItem('overhaul_last_crashes');
  const errors = savedErrors ? JSON.parse(savedErrors) : [];
  errors.unshift({ timestamp: new Date().toISOString(), message: String(event.reason), stack: event.reason?.stack });
  localStorage.setItem('overhaul_last_crashes', JSON.stringify(errors.slice(0, 5)));
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Overhaul App Recovery" fallbackDescription="An unexpected error occurred during rendering. Tap below to reload safely.">
      <AppProvider>
        <RoutineProvider>
          <App />
        </RoutineProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
