import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../../utils/supabase'

/**
 * Hook to subscribe to conversation updates via Supabase Realtime
 *
 * Creates a single channel filtered to only the user's participant records.
 * This ensures users receive updates when:
 * - They are added to a new conversation (INSERT on conversation_participants)
 * - Their participant data changes (UPDATE on conversation_participants, e.g., last_read_at)
 * - A conversation they're in is updated (UPDATE on conversations, e.g., new message updates updated_at)
 *
 * By filtering on user_id instead of conversation_id, this hook catches real-time events
 * for NEW conversations the user is added to, not just existing ones.
 *
 * @param userId - The current user's ID to subscribe to their participant events
 *
 * @example
 * ```typescript
 * function ConversationsList() {
 *   const { profile } = useAuth();
 *   useSubscribeToConversations(profile?.id); // Auto-updates conversation list
 * }
 * ```
 */
export function useSubscribeToConversations(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // Create single channel filtered by user's participant records
    const channel = supabase
      .channel(`user-conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`, // Filter by current user's ID
        },
        (payload) => {
          console.log('User participant record changed:', payload)

          // Invalidate conversations list to refetch
          // This handles: new conversations, participant updates (last_read_at), removals
          queryClient.invalidateQueries({
            queryKey: ['conversations'],
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or when userId changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
