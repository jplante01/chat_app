import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsDb } from '../db'
import { useNotification } from './useNotification'

interface DeleteConversationParams {
  /** ID of the conversation to delete */
  conversationId: string
  /** ID of the current user leaving the conversation */
  userId: string
}

/**
 * Hook to delete a conversation for the current user
 *
 * Removes the current user as a participant from the conversation.
 * If this is the last participant, the conversation is automatically deleted via CASCADE.
 * This ensures that in 1:1 chats, deleting only removes it for the current user,
 * not for the other participant.
 *
 * @example
 * ```typescript
 * const deleteConversation = useDeleteConversation();
 *
 * deleteConversation.mutate(
 *   { conversationId: 'conv-id', userId: 'user-id' },
 *   {
 *     onSuccess: () => {
 *       // Navigate away if this was the selected conversation
 *     }
 *   }
 * );
 * ```
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()

  return useMutation({
    mutationFn: async ({ conversationId, userId }: DeleteConversationParams): Promise<void> => {
      await conversationsDb.deleteForUser(conversationId, userId)
    },

    onSuccess: () => {
      // Invalidate conversations list to remove the deleted conversation
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      success('Conversation deleted')
    },

    onError: (err) => {
      console.error('Failed to delete conversation:', err)
      showError('Failed to delete conversation. Please try again.')
    },
  })
}
