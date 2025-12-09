// src/db/conversations.ts
import supabase from '../../utils/supabase';
import type { ConversationWithParticipants } from '../types/database.types';

export const conversationsDb = {
  /**
   * Get all conversations for a specific user, with participant details
   * Used for: Displaying the conversation list sidebar
   * Returns conversations ordered by most recent activity first
   */
  getForCurrentUser: async (userId: string): Promise<ConversationWithParticipants[]> => {
    // Query from conversation_participants (filtered by user) and embed conversations with all participants
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations(
          *,
          participants:conversation_participants(
            *,
            profile:profiles(*)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    // Extract conversations from the nested structure and deduplicate
    const conversations = data
      .map(item => item.conversation)
      .filter((conv): conv is ConversationWithParticipants => conv !== null);

    // Deduplicate by conversation ID (in case user has multiple participant records)
    const uniqueConversations = Array.from(
      new Map(conversations.map(c => [c.id, c])).values()
    );

    // Sort by updated_at DESC (most recent first)
    return uniqueConversations.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },
};
