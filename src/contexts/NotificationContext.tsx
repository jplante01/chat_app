import { createContext } from 'react';

/**
 * Notification severity levels matching Material-UI Alert severities
 */
export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification data structure
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;

  /** Message text to display */
  message: string;

  /** Severity level affects color and icon */
  severity: NotificationSeverity;

  /** Duration in milliseconds before auto-hide (default: 6000) */
  autoHideDuration?: number;

  /** Optional action button/element to display */
  action?: React.ReactNode;
}

/**
 * Context interface for the notification system
 */
export interface NotificationContextType {
  /**
   * Display a notification with custom severity
   * @param message - Text to display
   * @param severity - Notification type (default: 'info')
   */
  showNotification: (message: string, severity?: NotificationSeverity) => void;

  /**
   * Display a success notification
   * @param message - Text to display
   */
  success: (message: string) => void;

  /**
   * Display an error notification
   * @param message - Text to display
   */
  error: (message: string) => void;

  /**
   * Display a warning notification
   * @param message - Text to display
   */
  warning: (message: string) => void;

  /**
   * Display an info notification
   * @param message - Text to display
   */
  info: (message: string) => void;

  /**
   * Display a notification with full customization
   * @param options - Complete notification configuration
   */
  showCustomNotification: (options: Omit<Notification, 'id'>) => void;

  /**
   * Current notification queue
   */
  notifications: Notification[];

  /**
   * Remove a notification from the queue
   * @param id - Notification ID to remove
   */
  removeNotification: (id: string) => void;
}

/**
 * Notification context for global notification state
 */
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
