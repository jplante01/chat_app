import { useQuery } from '@tanstack/react-query'
import { conversationsDb } from '../db'

export function useConversations(userId: string | null) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => conversationsDb.getForCurrentUser(userId!),
    enabled: !!userId, // Only run if userId exists
  })
}
