import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { MessageWithSender } from '../types/database.types';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true
}: MessageBubbleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        mb: 2,
        gap: 1,
      }}
    >
      {showAvatar && (
        <Avatar
          src={message.sender.avatar_url || undefined}
          sx={{
            width: 32,
            height: 32,
            visibility: showAvatar ? 'visible' : 'hidden',
            mb: 3,
          }}
        >
          {message.sender.username?.[0]?.toUpperCase() || '?'}
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        <Box
          sx={{
            bgcolor: isOwnMessage ? 'primary.main' : 'grey.200',
            color: 'primary.contrastText',
            // color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            px: 2,
            py: 1,
            wordWrap: 'break-word',
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            px: 1,
          }}
        >
          {formatMessageTime(message.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}
