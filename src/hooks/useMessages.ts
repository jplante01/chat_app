import { useQuery } from '@tanstack/react-query'
import { messagesDb } from '../db'

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesDb.getByConversation(conversationId!),
    enabled: !!conversationId, // Only run if conversationId exists
  })
}
