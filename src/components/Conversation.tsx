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
import ListItemIcon from '@mui/material/ListItemIcon';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { ConversationListItem } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

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
    return otherParticipants[0].profile.username;
  }

  return otherParticipants.map(p => p.profile.username).join(', ');
}

function getConversationAvatar(conversation: ConversationListItem, currentUserId?: string) {
  const otherParticipants = conversation.participants.filter(p => p.profile.id !== currentUserId);

  if (otherParticipants.length === 0) {
    return { src: undefined, initial: '?' };
  }

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

  if (diffMins < 1) return 'now';
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
  const formattedTimestamp = useMemo(() => formatTimestamp(lastMessageTime), [lastMessageTime]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const currentParticipant = useMemo(
    () => conversation.participants.find(p => p.user_id === profile?.id),
    [conversation, profile?.id]
  );
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
      disableGutters
      secondaryAction={
        <Stack direction="column" alignItems="center" sx={{ mr: 0 }}>
          <IconButton
            edge="start"
            aria-label="more actions"
            onClick={handleMenuClick}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <IconDotsVertical size={16} />
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              color: selected ? 'primary.main' : 'text.secondary',
              ml: 1,
              mr: 1,
              minWidth: { xs: 28, sm: 36 },
              fontSize: '0.65rem',
              textAlign: 'center',
            }}
          >
            {formattedTimestamp}
          </Typography>
        </Stack>
      }
      sx={{
        borderBottom: '1px dashed',
        borderColor: 'divider',
        position: 'relative',
        '&::before': selected
          ? {
              content: '">"',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'primary.main',
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.75rem',
              lineHeight: 1,
              width: 12,
              textAlign: 'center',
              zIndex: 1,
            }
          : {},
      }}
    >
      <ListItemButton
        onClick={onClick}
        selected={selected}
        sx={{
          pl: selected ? 1.5 : 2,
          pr: 6,
          py: 1.25,
          '&.Mui-selected': {
            bgcolor: 'action.selected',
            borderLeft: '2px solid',
            borderColor: 'primary.main',
          },
          '&.Mui-selected:hover': {
            bgcolor: 'action.selected',
          },
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <ListItemAvatar sx={{ minWidth: 44 }}>
          <Badge
            color="primary"
            variant="dot"
            invisible={!hasUnread}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: 'secondary.main',
                width: 7,
                height: 7,
                minWidth: 7,
                borderRadius: '1px',
              },
            }}
          >
            <Avatar
              src={avatar.src}
              sx={{
                width: 34,
                height: 34,
                bgcolor: selected ? 'primary.main' : 'action.selected',
                color: selected ? 'primary.contrastText' : 'text.secondary',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {avatar.initial}
            </Avatar>
          </Badge>
        </ListItemAvatar>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: hasUnread || selected ? 600 : 400,
              color: selected ? 'primary.main' : hasUnread ? 'text.primary' : 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              letterSpacing: '0.03em',
            }}
          >
            {conversationName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: hasUnread ? 'text.primary' : 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              fontWeight: hasUnread ? 500 : 400,
              fontSize: '0.7rem',
              opacity: hasUnread ? 1 : 0.7,
            }}
          >
            {conversation.latest_message?.content || '—'}
          </Typography>
        </Box>

        <ListItemText sx={{ display: 'none' }} />
      </ListItemButton>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          },
        }}
      >
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main', fontSize: '0.8rem' }}>
          <ListItemIcon sx={{ color: 'error.main', minWidth: 32 }}>
            <IconTrash size={16} />
          </ListItemIcon>
          delete
        </MenuItem>
      </Menu>
    </ListItem>
  );
}
