import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../../utils/supabase'

/**
 * Hook to subscribe to conversation updates via Supabase Realtime Broadcast
 *
 * Subscribes to a user-specific broadcast topic that receives events for:
 * - New conversations the user is added to (INSERT on conversation_participants)
 * - Participant data changes (UPDATE on conversation_participants, e.g., last_read_at)
 * - Conversation deletions (DELETE on conversation_participants)
 * - New messages in the user's conversations (INSERT on messages)
 *
 * Uses Supabase Realtime broadcast instead of postgres_changes to avoid RLS policy
 * evaluation issues with SECURITY DEFINER functions.
 *
 * **IMPORTANT:** This hook should be called at the top-level layout (e.g., MainLayout)
 * to persist the subscription across the entire authenticated session and prevent
 * re-subscription loops when components re-render.
 *
 * @param userId - The current user's ID to subscribe to their broadcast topic
 *
 * @example
 * ```typescript
 * function MainLayout() {
 *   const { profile } = useAuth();
 *   useSubscribeToConversations(profile?.id); // Set up once for entire session
 *   // ... rest of layout
 * }
 * ```
 */
export function useSubscribeToConversations(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  console.log('[useSubscribeToConversations] Hook called with userId:', userId)

  useEffect(() => {
    console.log('[useSubscribeToConversations] useEffect running, userId:', userId)
    if (!userId) {
      console.log('[useSubscribeToConversations] No userId, skipping subscription')
      return
    }

    console.log('[Realtime] Setting up broadcast subscription for user:', userId)

    // Subscribe to user-specific broadcast topic
    // Channel name must match topic_name from broadcast_changes()
    // Private broadcasts require config: { private: true }
    const channel = supabase
      .channel(`user:${userId}`, { config: { private: true } })
      .on(
        'broadcast',
        { event: '*' },  // Listen to all events (INSERT, UPDATE, DELETE)
        (payload) => {
          console.log('[Realtime] Received broadcast event:', payload)

          const { table, event: eventType } = payload.payload || {}

          // Handle conversation participant changes (creation, deletion, updates)
          if (table === 'conversation_participants') {
            console.log(`[Realtime] Conversation participant ${eventType}`)
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
          }

          // Handle message changes (invalidate both conversations and messages)
          else if (table === 'messages') {
            console.log(`[Realtime] Message ${eventType}`)
            const conversationId = payload.payload?.record?.conversation_id || payload.payload?.old_record?.conversation_id

            // Invalidate conversations list to update latest message preview
            queryClient.invalidateQueries({ queryKey: ['conversations'] })

            // Invalidate messages for the specific conversation
            if (conversationId) {
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status)
        if (err) {
          console.error('[Realtime] Subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✓ Successfully subscribed to conversations broadcast')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - check network/CORS settings')
        }
        if (status === 'TIMED_OUT') {
          console.error('[Realtime] Subscription timed out - WebSocket connection failed')
        }
      })

    // Handle page visibility changes (mobile browser backgrounding)
    // When page becomes visible again, check channel state and reconnect if needed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Realtime] Page became visible, checking channel state')

        // Don't reconnect if user has logged out or channel doesn't exist
        if (!userId || !channel) {
          console.log('[Realtime] No userId or channel, skipping reconnection')
          return
        }

        const channelState = channel.state
        console.log('[Realtime] Channel state:', channelState)

        // If channel is closed or errored, resubscribe
        if (channelState === 'closed' || channelState === 'errored') {
          console.log('[Realtime] Reconnecting channel after page visibility change')
          channel.subscribe()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup subscription on unmount or when userId changes
    return () => {
      console.log('[Realtime] Cleaning up subscription for user:', userId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [userId]) // Removed queryClient from dependencies - it's stable
}
