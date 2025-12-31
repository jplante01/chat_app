import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useSubscribeToConversations } from '../hooks/useSubscribeToConversations';
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
  const queryClient = useQueryClient();
  const deleteConversation = useDeleteConversation();

  // Subscribe to conversation list updates
  useSubscribeToConversations(profile?.id);

  // Handle delete conversation request
  const handleDeleteRequest = (conversationId: string) => {
    const conversation = conversations?.find(c => c.id === conversationId);
    if (conversation) {
      setConversationToDelete(conversation);
      setDeleteDialogOpen(true);
    }
  };

  // Handle confirmed delete
  const handleDeleteConfirm = () => {
    if (!conversationToDelete || !profile?.id) return;

    deleteConversation.mutate(
      {
        conversationId: conversationToDelete.id,
        userId: profile.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setConversationToDelete(null);

          // If the deleted conversation was selected, deselect it
          if (selectedConversationId === conversationToDelete.id) {
            onConversationSelect('');
          }
        },
      }
    );
  };

  // Handle delete dialog close
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  // Handle conversation selection with optimistic update
  const handleConversationSelect = (conversationId: string) => {
    // Call parent handler to update selected conversation
    onConversationSelect(conversationId);

    // Optimistically update local cache to clear unread indicator instantly
    if (profile?.id) {
      queryClient.setQueryData<ConversationListItem[]>(
        ['conversations'],
        (old) => {
          if (!old) return old;

          return old.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  participants: conv.participants.map((p) =>
                    p.user_id === profile.id
                      ? { ...p, last_read_at: new Date().toISOString() }
                      : p
                  ),
                }
              : conv
          );
        }
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          Failed to load conversations
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            No conversations yet
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Click the + button to start a conversation
          </Typography>
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="new conversation"
          onClick={() => setDialogOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>

        {/* New Conversation Dialog */}
        <NewConversationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConversationCreated={(conversationId) => {
            onConversationSelect(conversationId);
          }}
        />
      </>
    );
  }

  // Success state - render conversations
  return (
    <>
      <List sx={{ width: '100%', bgcolor: 'background.paper', p: 2, pb: 0 }}>
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="new conversation"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConversationCreated={(conversationId) => {
          onConversationSelect(conversationId);
        }}
      />

      {/* Delete Confirmation Dialog */}
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
