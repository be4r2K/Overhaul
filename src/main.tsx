import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoutineProvider } from './context/RoutineContext';
import { AppProvider } from './context/AppContext';
import './index.css';

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
