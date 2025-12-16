# Component Architecture Guide

This document outlines best practices for organizing and structuring React components in this application.

## Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic, app-agnostic components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── chat/            # Domain-specific components (chat feature)
│   │   ├── MessageList/
│   │   ├── MessageInput/
│   │   └── ConversationCard/
│   └── layout/          # Layout components
│       ├── Header/
│       ├── Sidebar/
│       └── MainLayout/
├── pages/               # Page-level components (route components)
│   ├── ChatPage/
│   ├── LoginPage/
│   └── ProfilePage/
├── hooks/               # Custom React hooks
│   ├── useConversations.ts
│   ├── useMessages.ts
│   └── useSendMessage.ts
├── providers/           # Context providers
│   ├── ThemeProvider.tsx
│   └── QueryProvider.tsx
├── db/                  # Database layer
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Component Organization Patterns

### 1. Single File Components (Simple)

For simple components with minimal logic:

```typescript
// src/components/chat/MessageBubble.tsx
import { Box, Typography } from '@mui/material';
import type { Message } from '@/types/database.types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <Box
      sx={{
        maxWidth: '70%',
        p: 2,
        borderRadius: 2,
        bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
        color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
    >
      <Typography variant="body1">{message.content}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {new Date(message.created_at).toLocaleTimeString()}
      </Typography>
    </Box>
  );
}
```

### 2. Directory-Based Components (Complex)

For complex components with multiple related files:

```
src/components/chat/ConversationList/
├── ConversationList.tsx       # Main component
├── ConversationListItem.tsx   # Sub-component
├── ConversationList.test.tsx  # Tests
└── index.ts                   # Re-export
```

```typescript
// src/components/chat/ConversationList/ConversationList.tsx
import { List } from '@mui/material';
import { ConversationListItem } from './ConversationListItem';
import { useConversations } from '@/hooks/useConversations';
import type { Profile } from '@/types/database.types';

interface ConversationListProps {
  currentUser: Profile;
}

export function ConversationList({ currentUser }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations(currentUser.id);

  if (isLoading) return <div>Loading...</div>;

  return (
    <List>
      {conversations?.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUser.id}
        />
      ))}
    </List>
  );
}
```

```typescript
// src/components/chat/ConversationList/index.ts
export { ConversationList } from './ConversationList';
```

## Component Patterns

### 1. Container/Presenter Pattern

Separate data fetching (container) from UI rendering (presenter):

```typescript
// src/components/chat/MessageList/MessageListContainer.tsx
import { useMessages } from '@/hooks/useMessages';
import { MessageListPresenter } from './MessageListPresenter';

interface MessageListContainerProps {
  conversationId: string;
}

export function MessageListContainer({ conversationId }: MessageListContainerProps) {
  const { data: messages, isLoading, error } = useMessages(conversationId);

  if (isLoading) return <div>Loading messages...</div>;
  if (error) return <div>Error loading messages</div>;

  return <MessageListPresenter messages={messages ?? []} />;
}
```

```typescript
// src/components/chat/MessageList/MessageListPresenter.tsx
import { Box } from '@mui/material';
import { MessageBubble } from '../MessageBubble';
import type { MessageWithSender } from '@/types/database.types';

interface MessageListPresenterProps {
  messages: MessageWithSender[];
}

export function MessageListPresenter({ messages }: MessageListPresenterProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </Box>
  );
}
```

**When to use:**
- Component has complex data fetching logic
- You want to test UI independently of data layer
- Multiple data sources feed the same UI

### 2. Composition Pattern

Build complex UIs by composing smaller components:

```typescript
// src/components/chat/ChatInterface/ChatInterface.tsx
import { Box } from '@mui/material';
import { ConversationList } from '../ConversationList';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
        <ConversationList
          userId={userId}
          onSelectConversation={setSelectedConversationId}
        />
      </Box>

      {/* Main chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversationId ? (
          <>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <MessageList conversationId={selectedConversationId} />
            </Box>
            <MessageInput conversationId={selectedConversationId} />
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            Select a conversation to start chatting
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

### 3. Compound Components Pattern

Create components that work together with shared state:

```typescript
// src/components/common/Tabs/Tabs.tsx
import { createContext, useContext, useState } from 'react';
import { Box, Button } from '@mui/material';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs compound components must be used within Tabs');
  return context;
}

export function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <Box>{children}</Box>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
      {children}
    </Box>
  );
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();

  return (
    <Button
      onClick={() => setActiveTab(value)}
      variant={activeTab === value ? 'contained' : 'text'}
    >
      {children}
    </Button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return <Box sx={{ p: 2 }}>{children}</Box>;
}
```

Usage:

```typescript
<Tabs defaultTab="messages">
  <TabList>
    <Tab value="messages">Messages</Tab>
    <Tab value="profile">Profile</Tab>
  </TabList>
  <TabPanel value="messages">
    <MessageList />
  </TabPanel>
  <TabPanel value="profile">
    <ProfileSettings />
  </TabPanel>
</Tabs>
```

## Component Best Practices

### 1. Props Interface Definition

Always define explicit prop interfaces:

```typescript
// ✅ Good - Clear interface
interface MessageInputProps {
  conversationId: string;
  onSend?: (message: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function MessageInput({
  conversationId,
  onSend,
  placeholder = 'Type a message...',
  maxLength = 500,
}: MessageInputProps) {
  // ...
}

// ❌ Bad - Inline types
export function MessageInput({ conversationId, onSend }: {
  conversationId: string;
  onSend?: (message: string) => void;
}) {
  // ...
}
```

### 2. Event Handler Naming

Use consistent naming for event handlers:

```typescript
// Props (callback functions passed to component)
interface ButtonProps {
  onClick: () => void;      // ✅ onClick
  onSubmit: () => void;     // ✅ onSubmit
  onUserSelect: (id: string) => void;  // ✅ onUserSelect
}

// Internal handlers (within component)
function MyComponent({ onClick }: ButtonProps) {
  const handleClick = () => {          // ✅ handleClick
    // Do something
    onClick();
  };

  const handleSubmit = (e: FormEvent) => {  // ✅ handleSubmit
    e.preventDefault();
    // ...
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### 3. State Colocation

Keep state as close as possible to where it's used:

```typescript
// ❌ Bad - State too high in the tree
function ChatPage() {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  return (
    <Box>
      <ConversationList />
      <MessageList />
      <MessageInput
        value={messageText}
        onChange={setMessageText}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
      />
    </Box>
  );
}

// ✅ Good - State lives in MessageInput
function MessageInput() {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Use state locally
}
```

### 4. Prop Drilling vs Context

**Use props** for 1-2 levels of nesting:

```typescript
// ✅ Good - Direct prop passing
function ChatPage() {
  return <MessageList currentUserId={userId} />;
}

function MessageList({ currentUserId }: { currentUserId: string }) {
  return <MessageBubble isOwnMessage={message.sender_id === currentUserId} />;
}
```

**Use context** for deeply nested or widely used data:

```typescript
// ✅ Good - Context for auth user (used everywhere)
const AuthContext = createContext<{ user: Profile | null } | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### 5. Component Size

Keep components focused and small:

```typescript
// ❌ Bad - Component doing too much
function ChatPage() {
  // 200+ lines of code
  // Handles conversations, messages, input, settings, notifications...
}

// ✅ Good - Single responsibility
function ChatPage() {
  return (
    <Box>
      <ConversationSidebar />
      <MessageArea />
      <NotificationPanel />
    </Box>
  );
}
```

**Rule of thumb:**
- < 100 lines: Good
- 100-200 lines: Consider splitting
- \> 200 lines: Definitely split

### 6. Early Returns for Loading/Error States

Handle edge cases early:

```typescript
// ✅ Good - Early returns
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Skeleton variant="rectangular" height={200} />;
  if (error) return <Alert severity="error">Failed to load user</Alert>;
  if (!user) return <Alert severity="info">User not found</Alert>;

  // Main render - no nesting needed
  return (
    <Card>
      <Avatar src={user.avatar_url} />
      <Typography variant="h5">{user.username}</Typography>
    </Card>
  );
}

// ❌ Bad - Nested conditions
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  return (
    <Box>
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <Alert severity="error">Error</Alert>
      ) : user ? (
        <Card>...</Card>
      ) : (
        <Alert>Not found</Alert>
      )}
    </Box>
  );
}
```

### 7. Avoid Inline Function Definitions in JSX

```typescript
// ❌ Bad - New function created on every render
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <Box>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onClick={() => console.log(msg.id)}  // ❌ New function every render
        />
      ))}
    </Box>
  );
}

// ✅ Good - Stable callback with useCallback
function MessageList({ messages }: { messages: Message[] }) {
  const handleMessageClick = useCallback((messageId: string) => {
    console.log(messageId);
  }, []);

  return (
    <Box>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onClick={() => handleMessageClick(msg.id)}
        />
      ))}
    </Box>
  );
}

// ✅ Even better - Pass ID and handle in child
function MessageBubble({ message, onMessageClick }: Props) {
  return (
    <Box onClick={() => onMessageClick(message.id)}>
      {message.content}
    </Box>
  );
}
```

## Component Naming Conventions

### File Names
- **Components**: PascalCase - `MessageBubble.tsx`
- **Hooks**: camelCase with 'use' prefix - `useMessages.ts`
- **Utils**: camelCase - `formatDate.ts`
- **Types**: camelCase - `database.types.ts`

### Component Names
```typescript
// ✅ Good
export function MessageBubble() {}
export function ConversationList() {}
export function ChatInterface() {}

// ❌ Bad
export function message_bubble() {}
export function conversationlist() {}
export function Chat() {}  // Too generic
```

### Props Naming
```typescript
// ✅ Good
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onDelete?: (messageId: string) => void;
}

// ❌ Bad
interface Props {  // Too generic
  msg: any;        // Abbreviated, uses 'any'
  own: boolean;    // Unclear
  delete?: Function;  // Uses generic Function type
}
```

## When to Create a New Component

Extract a component when:

1. **Reusability**: Used in 2+ places
2. **Complexity**: Component body > 50 lines
3. **Separation of concerns**: Mixing different responsibilities
4. **Testing**: Need to test specific behavior in isolation
5. **Performance**: Need to optimize re-renders with `memo()`

```typescript
// Before: Large component
function ChatPage() {
  return (
    <Box>
      <Box sx={{ width: 300 }}>
        {conversations.map((conv) => (
          <Box key={conv.id} onClick={() => setSelected(conv.id)}>
            <Avatar src={conv.avatar} />
            <Typography>{conv.name}</Typography>
            <Typography>{conv.lastMessage}</Typography>
          </Box>
        ))}
      </Box>
      {/* More JSX... */}
    </Box>
  );
}

// After: Extracted components
function ChatPage() {
  return (
    <Box>
      <ConversationSidebar conversations={conversations} onSelect={setSelected} />
      <MessageArea selectedId={selectedId} />
    </Box>
  );
}

function ConversationSidebar({ conversations, onSelect }: Props) {
  return (
    <Box sx={{ width: 300 }}>
      {conversations.map((conv) => (
        <ConversationCard
          key={conv.id}
          conversation={conv}
          onClick={onSelect}
        />
      ))}
    </Box>
  );
}
```

## Summary

**Key Principles:**
1. **Single Responsibility**: Each component does one thing well
2. **Composition over Complexity**: Build complex UIs from simple pieces
3. **Props over Context**: Use props for direct parent-child communication
4. **Collocate State**: Keep state close to where it's used
5. **Type Safety**: Always define explicit prop interfaces
6. **Consistent Naming**: Follow established naming conventions
7. **Early Returns**: Handle edge cases at the top of components
8. **Performance**: Avoid unnecessary re-renders and inline functions

**Remember:**
- Start simple, refactor when needed
- Prefer readability over cleverness
- Test at the appropriate level (prefer testing database layer over unit testing components)
- Use MUI components as building blocks
- Keep the component tree shallow when possible
