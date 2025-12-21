import { ReactNode, useState, useCallback } from 'react';
import {
  NotificationContext,
  Notification,
  NotificationSeverity,
} from '../contexts/NotificationContext';
import NotificationContainer from '../components/notifications/NotificationContainer';

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider component for global notification system
 *
 * Manages notification queue and provides methods to show/hide notifications.
 * Wraps children with NotificationContext and renders NotificationContainer.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Add a notification to the queue
   */
  const showNotification = useCallback(
    (message: string, severity: NotificationSeverity = 'info') => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        message,
        severity,
        autoHideDuration: 6000,
      };

      setNotifications((prev) => [...prev, notification]);
    },
    []
  );

  /**
   * Show a success notification
   */
  const success = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  /**
   * Show an error notification
   */
  const error = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  /**
   * Show a warning notification
   */
  const warning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  /**
   * Show an info notification
   */
  const info = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  /**
   * Show a notification with full customization
   */
  const showCustomNotification = useCallback((options: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      ...options,
      id,
      autoHideDuration: options.autoHideDuration ?? 6000,
    };

    setNotifications((prev) => [...prev, notification]);
  }, []);

  /**
   * Remove a notification from the queue
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    notifications,
    showNotification,
    success,
    error,
    warning,
    info,
    showCustomNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}
