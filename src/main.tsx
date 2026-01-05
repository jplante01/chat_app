import * as ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { NotificationProvider } from './providers/NotificationProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode disabled - causes duplicate WebSocket connections in development
  // <React.StrictMode>
  <ThemeProvider>
    <NotificationProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </NotificationProvider>
  </ThemeProvider>
  // </React.StrictMode>,
);
