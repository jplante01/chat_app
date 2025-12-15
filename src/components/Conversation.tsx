import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { ConversationListItem } from '@/types/database.types';

interface ConversationProps {
  conversation: ConversationListItem;
  selected?: boolean;
  onClick?: () => void;
}

function getOtherParticipant(conversation: ConversationListItem, currentUserId?: string) {
  return conversation.participants.find(p => p.profile.id !== currentUserId)?.profile;
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
  const otherUser = getOtherParticipant(conversation);
  const lastMessageTime = conversation.latest_message?.created_at || conversation.created_at;

  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} onClick={onClick}>
        <ListItemAvatar>
          <Avatar src={otherUser?.avatar_url || undefined}>
            {otherUser?.username?.[0]?.toUpperCase() || '?'}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={otherUser?.username || 'Unknown User'}
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
