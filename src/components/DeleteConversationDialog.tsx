import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';

interface DeleteConversationDialogProps {
  open: boolean;
  conversationName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Confirmation dialog for deleting a conversation
 *
 * Shows a warning message and requires explicit user confirmation
 * before deleting a conversation.
 */
export default function DeleteConversationDialog({
  open,
  conversationName,
  onClose,
  onConfirm,
  loading = false,
}: DeleteConversationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Conversation?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete your conversation with <strong>{conversationName}</strong>?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
