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

  // Auto-scroll to bottom when messages change
  // useLayoutEffect runs synchronously before browser paint, preventing visible scroll
  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark conversation as read when user views it or when messages update
  // This handles: opening conversation, new messages arriving, and user sending messages
  useEffect(() => {
    if (conversationId && profile?.id) {
      participantsDb.markAsRead(conversationId, profile.id).catch((err) => {
        console.error('Failed to mark conversation as read:', err);
      });
    }
  }, [conversationId, profile?.id, messages]);

  const handleSendMessage = (content: string) => {
    if (!conversationId || !profile?.id) return;

    sendMessage.mutate({
      conversation_id: conversationId,
      sender_id: profile.id,
      content,
    });
  };

  // No conversation selected
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
        <Toolbar />
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
              bgcolor: 'background.paper',
              borderRadius: 2,
              px: 8,
              py: 4,

            }}
          >
            <Typography
              color="text.secondary"
              variant="h5"
              sx={{
                fontWeight: 300,
                textAlign: 'center',
                letterSpacing: '0.1em',
              }}
            >
              Select a conversation to start chatting
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
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
          p: 3
        }}
      >
        <Typography color="error" variant="h6" gutterBottom>
          Failed to load messages
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {error instanceof Error ? error.message : 'Unknown error'}
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
      <Toolbar />

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
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === profile?.id}
              />
            ))}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
      </Box>

      <MessageInput onSend={handleSendMessage} disabled={sendMessage.isPending} />
    </Box>
  );
}
