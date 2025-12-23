import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../../utils/supabase'
import type { ConversationListItem } from '../types/database.types'

/**
 * Hook to subscribe to conversation updates via Supabase Realtime
 *
 * Creates a single channel filtered to only the user's conversations.
 * This ensures users only receive updates for their own conversations, not all
 * conversations in the database.
 *
 * Listens for changes to conversations and conversation_participants tables
 * to keep the conversation list up-to-date.
 *
 * Invalidates the conversations query when:
 * - Conversations are updated (e.g., new message updates updated_at)
 * - Participants are added/removed
 * - Participant data changes (e.g., last_read_at for unread indicators)
 *
 * @param conversations - The list of conversations to subscribe to
 *
 * @example
 * ```typescript
 * function ConversationsList() {
 *   const { profile } = useAuth();
 *   const { data: conversations } = useConversations(profile?.id);
 *   useSubscribeToConversations(conversations); // Auto-updates conversation list
 * }
 * ```
 */
export function useSubscribeToConversations(conversations: ConversationListItem[] | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversations || conversations.length === 0) return

    // Extract conversation IDs to filter subscription
    const conversationIds = conversations.map((c) => c.id)

    // Create single channel filtered by user's conversation IDs
    const channel = supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations',
          filter: `id=in.(${conversationIds.join(',')})`, // Filter by user's conversation IDs
        },
        (payload) => {
          console.log('Conversation updated:', payload)

          // Invalidate conversations list to refetch
          queryClient.invalidateQueries({
            queryKey: ['conversations'],
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=in.(${conversationIds.join(',')})`, // Filter by user's conversation IDs
        },
        (payload) => {
          console.log('Conversation participants updated:', payload)

          // Invalidate conversations list (affects unread indicators, participant list)
          queryClient.invalidateQueries({
            queryKey: ['conversations'],
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or when conversations change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversations, queryClient])
}
