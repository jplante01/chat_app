import List from '@mui/material/List';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ConversationListItem } from '../types/database.types';
import Conversation from './Conversation';
import { useConversations } from '../hooks/useConversations';
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
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          No conversations yet
        </Typography>
        <Typography color="text.secondary" variant="caption">
          Search for users above to start chatting
        </Typography>
      </Box>
    );
  }

  // Success state - render conversations
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 2, pb: 0 }}>
      {conversations.map((conversation) => (
        <Conversation
          key={conversation.id}
          conversation={conversation}
          selected={selectedConversationId === conversation.id}
          onClick={() => onConversationSelect(conversation.id)}
        />
      ))}
    </List>
  );
}
