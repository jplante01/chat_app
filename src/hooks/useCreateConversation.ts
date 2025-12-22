import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsDb } from '../db'
import { useNotification } from './useNotification'

interface CreateConversationParams {
  /** ID of the current user */
  currentUserId: string
  /** ID of the other user to start conversation with */
  otherUserId: string
}

interface CreateConversationResult {
  /** ID of the conversation (existing or newly created) */
  conversationId: string
  /** Whether this was an existing conversation */
  isExisting: boolean
}

/**
 * Hook to create a new 1:1 conversation or return existing one
 *
 * Checks if a conversation already exists between the two users.
 * If it exists, returns the existing conversation ID.
 * If not, creates a new conversation and returns the new ID.
 *
 * @example
 * ```typescript
 * const createConversation = useCreateConversation();
 *
 * createConversation.mutate(
 *   { currentUserId: 'user-1', otherUserId: 'user-2' },
 *   {
 *     onSuccess: ({ conversationId, isExisting }) => {
 *       navigate(conversationId);
 *     }
 *   }
 * );
 * ```
 */
export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()

  return useMutation({
    mutationFn: async ({
      currentUserId,
      otherUserId,
    }: CreateConversationParams): Promise<CreateConversationResult> => {
      // Check if conversation already exists
      const existingId = await conversationsDb.checkExists(currentUserId, otherUserId)

      if (existingId) {
        return {
          conversationId: existingId,
          isExisting: true,
        }
      }

      // Create new conversation with both users as participants
      const conversation = await conversationsDb.create([currentUserId, otherUserId])

      return {
        conversationId: conversation.id,
        isExisting: false,
      }
    },

    onSuccess: ({ isExisting }) => {
      // Invalidate conversations list to show the new/existing conversation
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      // Show appropriate notification
      if (!isExisting) {
        success('Conversation created')
      }
    },

    onError: (err) => {
      console.error('Failed to create conversation:', err)
      showError('Failed to create conversation. Please try again.')
    },
  })
}
