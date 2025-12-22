import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import UserSearch from './UserSearch';
import { Profile } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useCreateConversation } from '../hooks/useCreateConversation';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

/**
 * Modal dialog for creating a new 1:1 conversation
 *
 * Allows user to search for other users and start a conversation.
 * If a conversation already exists with the selected user, navigates to it.
 * Otherwise, creates a new conversation and navigates to it.
 */
export default function NewConversationDialog({
  open,
  onClose,
  onConversationCreated,
}: NewConversationDialogProps) {
  const { profile } = useAuth();
  const createConversation = useCreateConversation();

  const handleUserSelect = (user: Profile) => {
    if (!profile?.id) return;

    createConversation.mutate(
      {
        currentUserId: profile.id,
        otherUserId: user.id,
      },
      {
        onSuccess: ({ conversationId }) => {
          onConversationCreated(conversationId);
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '500px',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
        New Conversation
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {profile && (
          <UserSearch
            currentUserId={profile.id}
            onUserSelect={handleUserSelect}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
