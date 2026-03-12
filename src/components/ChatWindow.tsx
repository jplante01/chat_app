import { useRef, useEffect, useLayoutEffect } from 'react';
import { Toolbar, Typography, Box, CircularProgress } from '@mui/material';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { useAuth } from '../contexts/AuthContext';
import { participantsDb } from '../db';

interface ChatWindowProps {
  drawerWidth: number;
  conversationId: string | null;
}

export default function ChatWindow({ drawerWidth, conversationId }: ChatWindowProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const sendMessage = useSendMessage();

  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId && profile?.id) {
      participantsDb.markAsRead(conversationId, profile.id).catch((err) => {
        console.error('Failed to mark conversation as read:', err);
      });
    }
  }, [conversationId, profile?.id, messages]);

  const handleSendMessage = (content: string) => {
    if (!conversationId || !profile?.id) return;
    sendMessage.mutate({ conversation_id: conversationId, sender_id: profile.id, content });
  };

  if (!conversationId) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100dvh',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 48, sm: 52 } }} />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              px: 6,
              py: 3,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                mb: 0.5,
              }}
            >
              {'// select a conversation'}
            </Typography>
            <Typography
              sx={{
                color: 'primary.main',
                fontSize: '0.7rem',
                opacity: 0.5,
              }}
            >
              {'waiting for input_'}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          p: 3,
        }}
      >
        <Typography sx={{ color: 'error.main', fontSize: '0.8rem' }}>
          [error] failed to load messages
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.5 }}>
          {error instanceof Error ? error.message : 'unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        height: '100dvh',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 48, sm: 52 } }} />

      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === profile?.id}
            />
          ))
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', opacity: 0.6 }}>
              {'// no messages yet'}
            </Typography>
          </Box>
        )}
      </Box>

      <MessageInput onSend={handleSendMessage} disabled={sendMessage.isPending} />
    </Box>
  );
}
