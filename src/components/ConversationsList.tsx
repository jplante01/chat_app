import List from '@mui/material/List';
import { ConversationListItem } from '@/types/database.types';
import Conversation from './Conversation';

interface ConversationsListProps {
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

const MOCK_CONVERSATIONS: ConversationListItem[] = [
  {
    id: '1',
    created_at: '2025-12-14T10:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
    participants: [
      {
        id: '1',
        conversation_id: '1',
        user_id: 'current-user',
        joined_at: '2025-12-14T10:00:00Z',
        profile: {
          id: 'current-user',
          username: 'You',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-15T09:42:00Z',
          status: 'online',
        },
      },
      {
        id: '2',
        conversation_id: '1',
        user_id: 'alice-id',
        joined_at: '2025-12-14T10:00:00Z',
        profile: {
          id: 'alice-id',
          username: 'Alice',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-15T09:30:00Z',
          status: 'online',
        },
      },
    ],
    latest_message: {
      id: '1',
      conversation_id: '1',
      sender_id: 'alice-id',
      content: 'Hey! How are you doing?',
      created_at: '2025-12-15T09:30:00Z',
      updated_at: '2025-12-15T09:30:00Z',
      deleted_at: null,
      edited: false,
      reply_to_id: null,
      sender: {
        id: 'alice-id',
        username: 'Alice',
        avatar_url: null,
        created_at: '2025-12-01T10:00:00Z',
        last_seen_at: '2025-12-15T09:30:00Z',
        status: 'online',
      },
    },
  },
  {
    id: '2',
    created_at: '2025-12-13T15:00:00Z',
    updated_at: '2025-12-14T20:15:00Z',
    participants: [
      {
        id: '3',
        conversation_id: '2',
        user_id: 'current-user',
        joined_at: '2025-12-13T15:00:00Z',
        profile: {
          id: 'current-user',
          username: 'You',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-15T09:42:00Z',
          status: 'online',
        },
      },
      {
        id: '4',
        conversation_id: '2',
        user_id: 'bob-id',
        joined_at: '2025-12-13T15:00:00Z',
        profile: {
          id: 'bob-id',
          username: 'Bob',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-14T20:15:00Z',
          status: 'offline',
        },
      },
    ],
    latest_message: {
      id: '2',
      conversation_id: '2',
      sender_id: 'current-user',
      content: 'Sounds good, see you tomorrow!',
      created_at: '2025-12-14T20:15:00Z',
      updated_at: '2025-12-14T20:15:00Z',
      deleted_at: null,
      edited: false,
      reply_to_id: null,
      sender: {
        id: 'current-user',
        username: 'You',
        avatar_url: null,
        created_at: '2025-12-01T10:00:00Z',
        last_seen_at: '2025-12-15T09:42:00Z',
        status: 'online',
      },
    },
  },
  {
    id: '3',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-12T14:22:00Z',
    participants: [
      {
        id: '5',
        conversation_id: '3',
        user_id: 'current-user',
        joined_at: '2025-12-10T08:00:00Z',
        profile: {
          id: 'current-user',
          username: 'You',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-15T09:42:00Z',
          status: 'online',
        },
      },
      {
        id: '6',
        conversation_id: '3',
        user_id: 'charlie-id',
        joined_at: '2025-12-10T08:00:00Z',
        profile: {
          id: 'charlie-id',
          username: 'Charlie',
          avatar_url: null,
          created_at: '2025-12-01T10:00:00Z',
          last_seen_at: '2025-12-12T14:22:00Z',
          status: 'offline',
        },
      },
    ],
    latest_message: {
      id: '3',
      conversation_id: '3',
      sender_id: 'charlie-id',
      content: 'Thanks for the help with the project!',
      created_at: '2025-12-12T14:22:00Z',
      updated_at: '2025-12-12T14:22:00Z',
      deleted_at: null,
      edited: false,
      reply_to_id: null,
      sender: {
        id: 'charlie-id',
        username: 'Charlie',
        avatar_url: null,
        created_at: '2025-12-01T10:00:00Z',
        last_seen_at: '2025-12-12T14:22:00Z',
        status: 'offline',
      },
    },
  },
];

export default function ConversationsList({
  selectedConversationId,
  onConversationSelect,
}: ConversationsListProps) {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper',  p: 2, pb: 0 }}>
      {MOCK_CONVERSATIONS.map((conversation) => (
        <Conversation
          key={conversation.id}
          conversation={conversation}
          selected={selectedConversationId === conversation.id}
          onClick={() => onConversationSelect(conversation.id)}
        />
      ))}
    </List>
  );
}
