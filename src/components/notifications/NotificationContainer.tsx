import { useContext } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { NotificationContext } from '../../contexts/NotificationContext';

/**
 * Container component that renders all active notifications
 *
 * Displays up to 3 notifications simultaneously, stacked vertically
 * in the bottom-right corner. Additional notifications wait in queue.
 *
 * Uses Material-UI Snackbar and Alert components with automatic
 * dismissal and manual close buttons.
 */
export default function NotificationContainer() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('NotificationContainer must be used within a NotificationProvider');
  }

  const { notifications, removeNotification } = context;

  // Limit to 3 visible notifications (Material-UI best practice)
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            // Stack notifications vertically with 72px spacing
            // (64px Alert height + 8px gap)
            bottom: `${24 + index * 72}px !important`,
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
            action={notification.action}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
