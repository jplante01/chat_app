import { useState, MouseEvent, useMemo } from 'react';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemIcon from '@mui/material/ListItemIcon';
import { ConversationListItem } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

interface ConversationProps {
  conversation: ConversationListItem;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: (conversationId: string) => void;
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

export default function Conversation({ conversation, selected = false, onClick, onDelete }: ConversationProps) {
  const { profile } = useAuth();
  const conversationName = useMemo(() => getConversationName(conversation, profile?.id), [conversation, profile?.id]);
  const avatar = useMemo(() => getConversationAvatar(conversation, profile?.id), [conversation, profile?.id]);
  const lastMessageTime = conversation.latest_message?.created_at || conversation.created_at;
  const formattedTimestamp = useMemo(() => formatTimestamp(lastMessageTime), [lastMessageTime])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // Check if conversation has unread messages
  // Compare conversation.updated_at with current user's last_read_at
  const currentParticipant = useMemo(() => conversation.participants.find(p => p.user_id === profile?.id), [conversation, profile?.id]);
  const hasUnread = useMemo(() => {                                                                                                              
    if (!currentParticipant) return false;                                                                                                       
    return new Date(conversation.updated_at) > new Date(currentParticipant.last_read_at);                                                        
  }, [currentParticipant, conversation.updated_at]);  

  const handleMenuClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(conversation.id);
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="more actions"
          onClick={handleMenuClick}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      }
    >
      <ListItemButton
        onClick={onClick}
        sx={{
          borderLeft: 3,
          borderColor: selected ? 'primary.main' : 'transparent',
          '&:hover': {
            borderColor: selected ? 'primary.main' : 'transparent',
          },
        }}
      >
        <ListItemAvatar>
          <Badge
            color="primary"
            variant="dot"
            invisible={!hasUnread}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Avatar src={avatar.src}>
              {avatar.initial}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography
              component="span"
              variant="body1"
              sx={{
                fontWeight: hasUnread || selected ? 600 : 400,
                color: selected ? 'primary.main' : 'inherit',
              }}
            >
              {conversationName}
            </Typography>
          }
          secondary={
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: selected ? 'primary.main' : 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                fontWeight: hasUnread || selected ? 600 : 400,
              }}
            >
              {conversation.latest_message?.content || 'No messages yet'}
            </Typography>
          }
        />
        <Typography
          variant="caption"
          sx={{
            color: selected ? 'primary.main' : 'text.secondary',
            ml: 1,
            mr: 2,
          }}
        >
          {formattedTimestamp}
        </Typography>
      </ListItemButton>

      {/* Three-dot menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete conversation</ListItemText>
        </MenuItem>
      </Menu>
    </ListItem>
  );
}
