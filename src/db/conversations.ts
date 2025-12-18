// src/db/conversations.ts
import supabase from '../../utils/supabase';
import type { ConversationListItem } from '../types/database.types';

export const conversationsDb = {
  /**
   * Get all conversations for a specific user, with participant details and latest message
   * Used for: Displaying the conversation list sidebar
   * Returns conversations ordered by most recent activity first
   */
  getForCurrentUser: async (userId: string): Promise<ConversationListItem[]> => {
    // Query from conversation_participants (filtered by user) and embed conversations with all participants and latest message
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations(
          *,
          participants:conversation_participants(
            *,
            profile:profiles(*)
          ),
          messages(
            *,
            sender:profiles(*)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { foreignTable: 'conversations.messages', ascending: false })
      .limit(1, { foreignTable: 'conversations.messages' });

    if (error) throw error;
    if (!data) return [];

    // Extract conversations from the nested structure and deduplicate
    const conversations = data
      .map(item => item.conversation)
      .filter((conv): conv is any => conv !== null);

    // Deduplicate by conversation ID (in case user has multiple participant records)
    const uniqueConversations = Array.from(
      new Map(conversations.map(c => [c.id, c])).values()
    );

    // Transform to ConversationListItem format (extract first message from array)
    const conversationsWithLatestMessage: ConversationListItem[] = uniqueConversations.map(conv => ({
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      participants: conv.participants,
      latest_message: conv.messages?.[0] || undefined,
    }));

    // Sort by updated_at DESC (most recent first)
    return conversationsWithLatestMessage.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },
};
