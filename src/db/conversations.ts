// src/db/conversations.ts
import supabase from '../../utils/supabase';
import type { ConversationListItem, Conversation } from '../types/database.types';

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

  /**
   * Check if a 1:1 conversation already exists between two users
   * Used for: Preventing duplicate conversations when creating new chat
   * Returns the existing conversation ID if found, null otherwise
   */
  checkExists: async (userId1: string, userId2: string): Promise<string | null> => {
    // Get all conversations where userId1 is a participant
    const { data: user1Conversations, error: error1 } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId1);

    if (error1) throw error1;
    if (!user1Conversations || user1Conversations.length === 0) return null;

    // Get all conversations where userId2 is a participant
    const { data: user2Conversations, error: error2 } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId2);

    if (error2) throw error2;
    if (!user2Conversations || user2Conversations.length === 0) return null;

    // Find conversation IDs that appear in both lists
    const user1ConvIds = new Set(user1Conversations.map(c => c.conversation_id));
    const commonConvIds = user2Conversations
      .map(c => c.conversation_id)
      .filter(id => user1ConvIds.has(id));

    if (commonConvIds.length === 0) return null;

    // For each common conversation, check if it has exactly 2 participants (1:1 chat)
    for (const convId of commonConvIds) {
      const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', convId);

      if (error) throw error;

      // If this conversation has exactly 2 participants, it's a 1:1 chat
      if (participants && participants.length === 2) {
        return convId;
      }
    }

    return null;
  },

  /**
   * Create a new conversation with participants atomically
   * Used for: Creating new 1:1 or group conversations
   * Returns the created conversation
   *
   * Uses PostgreSQL function to ensure atomic transaction -
   * both conversation and participants are created together or not at all.
   */
  create: async (participantIds: string[]): Promise<Conversation> => {
    // Call PostgreSQL function to atomically create conversation with participants
    const { data: conversationId, error: rpcError } = await supabase
      .rpc('create_conversation_with_participants', {
        participant_ids: participantIds,
      });

    if (rpcError) throw rpcError;
    if (!conversationId) throw new Error('Failed to create conversation');

    // Fetch the created conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select()
      .eq('id', conversationId)
      .single();

    if (fetchError) throw fetchError;
    if (!conversation) throw new Error('Conversation not found after creation');

    return conversation;
  },

  /**
   * Delete an entire conversation for all participants
   * Used for: User deleting a conversation from their sidebar
   *
   * Uses a database function that explicitly deletes each participant record,
   * triggering realtime DELETE events for each participant's subscription.
   * This ensures all users see the conversation disappear immediately.
   *
   * The function also handles authorization (requires user to be a participant)
   * and cleanup (deletes conversation after participants are removed).
   */
  deleteForUser: async (conversationId: string, userId: string): Promise<void> => {
    // Call database function to delete conversation and notify all participants
    const { error } = await supabase
      .rpc('delete_conversation_and_notify', {
        conversation_id: conversationId,
      });

    if (error) throw error;
  },
};
