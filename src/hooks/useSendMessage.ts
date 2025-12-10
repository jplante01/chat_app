import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesDb } from '../db'
import type { MessageInsert } from '../types/database.types'

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: MessageInsert) => messagesDb.create(message),
    onSuccess: (newMessage) => {
      // Invalidate and refetch messages for this conversation
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
