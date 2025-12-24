import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { NotificationProvider } from './providers/NotificationProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
