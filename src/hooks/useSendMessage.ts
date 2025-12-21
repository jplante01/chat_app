import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesDb } from '../db'
import type { MessageInsert, MessageWithSender } from '../types/database.types'
import { useNotification } from './useNotification'

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { error: showError } = useNotification()

  return useMutation({
    mutationFn: (message: MessageInsert) => messagesDb.create(message),

    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: ['messages', newMessage.conversation_id],
      })

      // Snapshot the previous messages for rollback on error
      const previousMessages = queryClient.getQueryData<MessageWithSender[]>([
        'messages',
        newMessage.conversation_id,
      ])

      // Optimistically update the cache with a temporary message
      queryClient.setQueryData<MessageWithSender[]>(
        ['messages', newMessage.conversation_id],
        (old = []) => [
          ...old,
          {
            // Temporary ID - will be replaced with real ID from server
            id: `temp-${Date.now()}`,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            edited: false,
            reply_to_id: newMessage.reply_to_id || null,
            // Mock sender profile - will be replaced with real data from server
            sender: {
              id: newMessage.sender_id,
              username: 'You', // Placeholder
              avatar_url: null,
              status: 'online',
              created_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            },
          } as MessageWithSender,
        ]
      )

      // Return context with snapshot for potential rollback
      return { previousMessages }
    },

    onError: (err, newMessage, context) => {
      // Rollback to previous state on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', newMessage.conversation_id],
          context.previousMessages
        )
      }

      // Show error notification to user
      showError('Failed to send message. Please try again.')
    },

    onSuccess: (newMessage) => {
      // Invalidate and refetch to get the real message from the server
      // This replaces the optimistic message with the real one
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.conversation_id],
      })

      // Invalidate conversations list (to update timestamp/ordering)
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })
    },
  })
}
