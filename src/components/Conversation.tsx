import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { ConversationListItem } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

interface ConversationProps {
  conversation: ConversationListItem;
  selected?: boolean;
  onClick?: () => void;
}

function getConversationName(conversation: ConversationListItem, currentUserId?: string) {
  const otherParticipants = conversation.participants.filter(p => p.profile.id !== currentUserId);

  if (otherParticipants.length === 0) {
    return 'Empty Conversation';
  }

  if (otherParticipants.length === 1) {
    // 1-on-1 conversation: show the other person's name
    return otherParticipants[0].profile.username;
  }

  // Group conversation: show comma-separated names
  return otherParticipants.map(p => p.profile.username).join(', ');
}

function getConversationAvatar(conversation: ConversationListItem, currentUserId?: string) {
  const otherParticipants = conversation.participants.filter(p => p.profile.id !== currentUserId);

  if (otherParticipants.length === 0) {
    return { src: undefined, initial: '?' };
  }

  // For 1-on-1, show the other person's avatar
  // For groups, show the first person's avatar
  const firstOther = otherParticipants[0].profile;
  return {
    src: firstOther.avatar_url || undefined,
    initial: firstOther.username?.[0]?.toUpperCase() || '?',
  };
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Conversation({ conversation, selected = false, onClick }: ConversationProps) {
  const { profile } = useAuth();
  const conversationName = getConversationName(conversation, profile?.id);
  const avatar = getConversationAvatar(conversation, profile?.id);
  const lastMessageTime = conversation.latest_message?.created_at || conversation.created_at;

  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} onClick={onClick}>
        <ListItemAvatar>
          <Avatar src={avatar.src}>
            {avatar.initial}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={conversationName}
          secondary={
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {conversation.latest_message?.content || 'No messages yet'}
            </Typography>
          }
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
          {formatTimestamp(lastMessageTime)}
        </Typography>
      </ListItemButton>
    </ListItem>
  );
}
