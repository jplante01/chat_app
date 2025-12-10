# Optimistic Updates - Future Improvements

This document outlines opportunities to add optimistic updates to TanStack Query mutations for better UX.

---

## Priority 1: High Priority (Add Soon)

### 1. Update Conversation Timestamp in useSendMessage

**Current Behavior:** Invalidates entire conversations list → refetches from server

**Optimistic Approach:** Update specific conversation's `updated_at` in cache and re-sort

**Benefits:**
- ✅ Conversation jumps to top instantly (no network wait)
- ✅ Avoids unnecessary refetch
- ✅ Better perceived performance

**Implementation:**
```typescript
export function useSendMessage(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: MessageInsert) => messagesDb.create(message),
    onSuccess: (newMessage) => {
      // Invalidate messages to show new message
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.conversation_id],
      })

      // Optimistically update conversation timestamp (avoid refetch)
      queryClient.setQueryData<ConversationWithParticipants[]>(
        ['conversations', userId],
        (oldConversations) => {
          if (!oldConversations) return oldConversations

          return oldConversations
            .map((conv) =>
              conv.id === newMessage.conversation_id
                ? { ...conv, updated_at: newMessage.created_at }
                : conv
            )
            .sort((a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
        }
      )
    },
  })
}
```

**Complexity:** Low
**Risk:** Low (just reordering existing data)

---

## Priority 2: Medium Priority (Add When Building UI)

### 2. Optimistic Message Send

**Current Behavior:** Send message → wait for server → show message

**Optimistic Approach:** Show message immediately with temp ID, replace when server responds

**Benefits:**
- ✅ Message appears instantly
- ✅ Best UX for chat apps (WhatsApp, Slack, Discord all do this)
- ✅ User can continue typing immediately

**Implementation:**
```typescript
export function useSendMessage(userId: string, currentUserProfile: Profile) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: MessageInsert) => messagesDb.create(message),

    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['messages', newMessage.conversation_id],
      })

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData([
        'messages',
        newMessage.conversation_id,
      ])

      // Optimistically add message
      queryClient.setQueryData<MessageWithSender[]>(
        ['messages', newMessage.conversation_id],
        (old) => [
          ...(old || []),
          {
            ...newMessage,
            id: 'temp-' + Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            edited: false,
            deleted_at: null,
            sender: currentUserProfile,
          },
        ]
      )

      return { previousMessages }
    },

    // Rollback on error
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(
        ['messages', newMessage.conversation_id],
        context?.previousMessages
      )
    },

    // Replace with real message
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversation_id],
      })
    },
  })
}
```

**Complexity:** Medium
**Requirements:** Need current user profile data (wait for auth context implementation)
**Risk:** Medium (need to handle rollback on failure)

---

## Priority 3: Low Priority (Future Features)

### 3. Mark Messages as Read

When implementing `participantsDb.updateLastRead()`:

```typescript
const useMarkAsRead = (userId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, userId }) =>
      participantsDb.updateLastRead(conversationId, userId),

    onMutate: ({ conversationId }) => {
      // Update unread count in conversation cache immediately
      queryClient.setQueryData<ConversationWithParticipants[]>(
        ['conversations', userId],
        (old) => {
          if (!old) return old
          return old.map((conv) =>
            conv.id === conversationId
              ? { ...conv, /* update unread count to 0 */ }
              : conv
          )
        }
      )
    },
  })
}
```

**Benefit:** Unread badge disappears instantly

---

### 4. Delete Message (Soft Delete)

```typescript
const useDeleteMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) => messagesDb.softDelete(messageId),

    onMutate: ({ messageId, conversationId }) => {
      // Remove message from UI immediately
      queryClient.setQueryData<MessageWithSender[]>(
        ['messages', conversationId],
        (old) => old?.filter((msg) => msg.id !== messageId) || []
      )
    },
  })
}
```

**Benefit:** Message disappears instantly
**Risk:** Very low (just hiding from UI)

---

## Implementation Notes

### General Pattern

```typescript
useMutation({
  mutationFn: () => dbOperation(),

  // Before mutation runs
  onMutate: async (variables) => {
    // 1. Cancel refetches
    await queryClient.cancelQueries({ queryKey })

    // 2. Snapshot old data
    const previous = queryClient.getQueryData(queryKey)

    // 3. Optimistically update cache
    queryClient.setQueryData(queryKey, (old) => /* new data */)

    // 4. Return context for rollback
    return { previous }
  },

  // If mutation fails
  onError: (err, variables, context) => {
    // Rollback to snapshot
    queryClient.setQueryData(queryKey, context?.previous)
  },

  // Always refetch to ensure sync
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey })
  },
})
```

### Trade-offs

**Optimistic Updates:**
- ✅ Instant UI feedback
- ✅ Better perceived performance
- ⚠️ More complex code
- ⚠️ Need rollback logic
- ⚠️ Can show stale data if logic has bugs

**Invalidation (Current Approach):**
- ✅ Simple code
- ✅ Always shows correct data
- ❌ Small delay for network request

### When to Use Optimistic Updates

**Good candidates:**
- High-frequency user actions (send message, mark as read)
- Simple data transformations (add/remove from list)
- Low risk of failure (valid input, user has permission)

**Avoid for:**
- Complex server-side logic
- Operations that might fail validation
- When server response structure differs significantly from input

---

## Recommendation Summary

1. **Add conversation timestamp update now** - Low complexity, high value
2. **Add optimistic message send when building UI** - High value, needs auth context
3. **Add read receipts and delete later** - As features are implemented
