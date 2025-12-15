import { useRef, useEffect } from 'react';
import { Toolbar, Typography, Box, Paper } from '@mui/material';
import { MessageWithSender } from '/types/database.types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  drawerWidth: number;
  conversationId: string | null;
}

const CURRENT_USER_ID = 'current-user';

const MOCK_MESSAGES: MessageWithSender[] = [
  {
    id: '1',
    conversation_id: '1',
    sender_id: 'alice-id',
    content: 'Hey! How are you doing?',
    created_at: '2025-12-15T09:30:00Z',
    updated_at: '2025-12-15T09:30:00Z',
    reply_to_id: null,
    sender: {
      id: 'alice-id',
      username: 'Alice',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '2',
    conversation_id: '1',
    sender_id: CURRENT_USER_ID,
    content: "I'm doing great! Just working on this new chat app. How about you?",
    created_at: '2025-12-15T09:32:00Z',
    updated_at: '2025-12-15T09:32:00Z',
    reply_to_id: null,
    sender: {
      id: CURRENT_USER_ID,
      username: 'You',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '3',
    conversation_id: '1',
    sender_id: 'alice-id',
    content: 'That sounds exciting! What tech stack are you using?',
    created_at: '2025-12-15T09:33:00Z',
    updated_at: '2025-12-15T09:33:00Z',
    reply_to_id: null,
    sender: {
      id: 'alice-id',
      username: 'Alice',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '4',
    conversation_id: '1',
    sender_id: CURRENT_USER_ID,
    content: "React with TypeScript for the frontend, Material-UI for the component library, and Supabase for the backend. It's been a really smooth experience so far - Supabase handles auth, database, and real-time subscriptions all in one.",
    created_at: '2025-12-15T09:35:00Z',
    updated_at: '2025-12-15T09:35:00Z',
    reply_to_id: null,
    sender: {
      id: CURRENT_USER_ID,
      username: 'You',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '5',
    conversation_id: '1',
    sender_id: 'alice-id',
    content: "Nice! I've heard great things about Supabase. Are you implementing real-time features?",
    created_at: '2025-12-15T09:37:00Z',
    updated_at: '2025-12-15T09:37:00Z',
    reply_to_id: null,
    sender: {
      id: 'alice-id',
      username: 'Alice',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '6',
    conversation_id: '1',
    sender_id: CURRENT_USER_ID,
    content: 'Yes! Planning to add real-time message updates, typing indicators, and online status. The architecture is already set up to support it.',
    created_at: '2025-12-15T09:40:00Z',
    updated_at: '2025-12-15T09:40:00Z',
    reply_to_id: null,
    sender: {
      id: CURRENT_USER_ID,
      username: 'You',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
  {
    id: '7',
    conversation_id: '1',
    sender_id: 'alice-id',
    content: 'Awesome! Let me know if you need any help testing it out when it\'s ready.',
    created_at: '2025-12-15T09:42:00Z',
    updated_at: '2025-12-15T09:42:00Z',
    reply_to_id: null,
    sender: {
      id: 'alice-id',
      username: 'Alice',
      avatar_url: null,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2025-12-01T10:00:00Z',
    },
  },
];

export default function ChatWindow({ drawerWidth, conversationId }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationId]);

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
    // TODO: Send message to database
  };

  if (!conversationId) {
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
        <Typography color="text.secondary" variant="h6">
          Select a conversation to start chatting
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
        height: '100vh',
      }}
    >
      <Toolbar />

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {MOCK_MESSAGES.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.sender_id === CURRENT_USER_ID}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <MessageInput onSend={handleSendMessage} />
    </Box>
  );
}
