import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { IconSend } from '@tabler/icons-react';

interface MessageInputProps {
  onSend?: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: 'background.default',
        borderTop: '1px dashed',
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end',
      }}
    >
      <Typography
        sx={{
          color: 'primary.main',
          fontSize: '0.85rem',
          pb: 0.9,
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        {'>'}
      </Typography>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
              borderStyle: 'dashed',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 1,
              borderStyle: 'solid',
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '0.85rem',
            '&::placeholder': {
              color: 'text.secondary',
              opacity: 0.5,
            },
          },
        }}
      />
      <IconButton
        type="submit"
        disabled={disabled || !message.trim()}
        sx={{
          mb: 0.5,
          color: message.trim() ? 'primary.main' : 'text.secondary',
          '&.Mui-disabled': { color: 'divider' },
        }}
        size="small"
      >
        <IconSend size={18} />
      </IconButton>
    </Box>
  );
}
