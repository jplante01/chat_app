import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../../utils/supabase'
import type { MessageWithSender } from '../types/database.types'

/**
 * Hook to subscribe to message updates for a specific conversation via Supabase Realtime
 *
 * Automatically invalidates the messages query when new messages arrive,
 * messages are updated, or messages are deleted.
 *
 * @param conversationId - The conversation to subscribe to
 *
 * @example
 * ```typescript
 * function ChatWindow({ conversationId }) {
 *   const { data: messages } = useMessages(conversationId);
 *   useSubscribeToMessages(conversationId); // Auto-updates on new messages
 * }
 * ```
 */
export function useSubscribeToMessages(conversationId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    // Subscribe to messages for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload)

          // Invalidate messages query to refetch
          queryClient.invalidateQueries({
            queryKey: ['messages', conversationId],
          })

          // Also invalidate conversations list (to update latest message)
          queryClient.invalidateQueries({
            queryKey: ['conversations'],
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload)

          // Invalidate messages query to refetch
          queryClient.invalidateQueries({
            queryKey: ['messages', conversationId],
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message deleted:', payload)

          // Invalidate messages query to refetch
          queryClient.invalidateQueries({
            queryKey: ['messages', conversationId],
          })

          // Also invalidate conversations list (to update latest message)
          queryClient.invalidateQueries({
            queryKey: ['conversations'],
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or conversation change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])
}
