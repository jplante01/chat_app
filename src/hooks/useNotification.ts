import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

/**
 * Hook to access the notification system
 *
 * Provides methods to display success, error, warning, and info notifications
 * throughout the application.
 *
 * @throws Error if used outside of NotificationProvider
 *
 * @example
 * ```typescript
 * const { success, error } = useNotification();
 *
 * // Simple usage
 * success('Profile updated!');
 * error('Failed to save changes');
 *
 * // Custom notification with action
 * showCustomNotification({
 *   message: 'Item deleted',
 *   severity: 'warning',
 *   action: <Button onClick={undo}>UNDO</Button>
 * });
 * ```
 */
export function useNotification() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}
