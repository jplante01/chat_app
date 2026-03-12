import { useState } from 'react';
import List from '@mui/material/List';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { ConversationListItem } from '../types/database.types';
import Conversation from './Conversation';
import NewConversationDialog from './NewConversationDialog';
import DeleteConversationDialog from './DeleteConversationDialog';
import { useConversations } from '../hooks/useConversations';
import { useDeleteConversation } from '../hooks/useDeleteConversation';
import { useAuth } from '../contexts/AuthContext';

interface ConversationsListProps {
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

export default function ConversationsList({
  selectedConversationId,
  onConversationSelect,
}: ConversationsListProps) {
  const { profile } = useAuth();
  const { data: conversations, isLoading, error } = useConversations(profile?.id || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationListItem | null>(null);
  const deleteConversation = useDeleteConversation();

  const handleDeleteRequest = (conversationId: string) => {
    const conversation = conversations?.find(c => c.id === conversationId);
    if (conversation) {
      setConversationToDelete(conversation);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (!conversationToDelete || !profile?.id) return;

    deleteConversation.mutate(
      { conversationId: conversationToDelete.id, userId: profile.id },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setConversationToDelete(null);
          if (selectedConversationId === conversationToDelete.id) {
            onConversationSelect('');
          }
        },
      }
    );
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleConversationSelect = (conversationId: string) => {
    onConversationSelect(conversationId);
  };

  const fab = (
    <Fab
      color="primary"
      aria-label="new conversation"
      onClick={() => setDialogOpen(true)}
      size="small"
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        '&:hover': { bgcolor: 'secondary.main' },
      }}
    >
      <AddIcon fontSize="small" />
    </Fab>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: 'error.main', fontSize: '0.75rem' }}>
          [error] failed to load conversations
        </Typography>
      </Box>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            no conversations yet
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', opacity: 0.6, mt: 0.5 }}>
            press + to start one
          </Typography>
        </Box>
        {fab}
        <NewConversationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConversationCreated={(conversationId) => onConversationSelect(conversationId)}
        />
      </>
    );
  }

  return (
    <>
      <List sx={{ width: '100%', p: 0, pb: 8 }}>
        {conversations.map((conversation) => (
          <Conversation
            key={conversation.id}
            conversation={conversation}
            selected={selectedConversationId === conversation.id}
            onClick={() => handleConversationSelect(conversation.id)}
            onDelete={handleDeleteRequest}
          />
        ))}
      </List>

      {fab}

      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConversationCreated={(conversationId) => onConversationSelect(conversationId)}
      />

      <DeleteConversationDialog
        open={deleteDialogOpen}
        conversationName={
          conversationToDelete
            ? conversationToDelete.participants
                .filter(p => p.user_id !== profile?.id)
                .map(p => p.profile.username)
                .join(', ') || 'this conversation'
            : ''
        }
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteConversation.isPending}
      />
    </>
  );
}
