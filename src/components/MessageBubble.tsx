import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MessageWithSender } from '../types/database.types';

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        mb: 1.5,
      }}
    >

      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        {!isOwnMessage && (
          <Typography
            variant="caption"
            sx={{
              color: 'secondary.main',
              px: 1,
              mb: 0.25,
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
            }}
          >
            {message.sender.username}
          </Typography>
        )}

        <Box
          sx={{
            bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            borderRadius: '2px',
            px: 1.5,
            py: 0.75,
            wordWrap: 'break-word',
            border: isOwnMessage ? 'none' : '1px dashed',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {message.content}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            mt: 0.25,
            px: 0.5,
            fontSize: '0.6rem',
            opacity: 0.6,
          }}
        >
          {formatMessageTime(message.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}
