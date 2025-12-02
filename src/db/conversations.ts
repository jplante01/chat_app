// src/db/conversations.ts
import supabase from '../../utils/supabase';
import type { Conversation } from '../types/database.types';

export const conversationsDb = {
  /**
   * Get all conversations for the current user, with participant details
   * Used for: Displaying the conversation list sidebar
   * Returns conversations ordered by most recent activity first
   */
  getForCurrentUser: async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get a single conversation by ID with all participant details
   * Used for: Loading conversation details when opening a chat
   */
  getById: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Find an existing 1-on-1 conversation between two users
   * Used for: Checking if a DM already exists before creating a new one
   * Returns the conversation ID if found, null otherwise
   */
  findDMBetweenUsers: async (
    userId1: string,
    userId2: string
  ): Promise<string | null> => {
    // Get all conversations where userId1 is a participant
    const { data: conversations, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId1);

    if (error) throw error;
    if (!conversations || conversations.length === 0) return null;

    // For each conversation, check if it's a 2-person chat with userId2
    for (const conv of conversations) {
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.conversation_id);

      if (participantsError) continue;

      // Check if this is a 2-person conversation with both users
      if (
        participants.length === 2 &&
        participants.some((p) => p.user_id === userId2)
      ) {
        return conv.conversation_id;
      }
    }

    return null;
  },

  /**
   * Create a new conversation
   * Used for: Starting a new chat (DM or group)
   * Returns the newly created conversation
   */
  create: async (): Promise<Conversation> => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a conversation (will cascade delete participants and messages)
   * Used for: Deleting a conversation
   * Note: Use with caution - this is permanent
   */
  delete: async (conversationId: string): Promise<void> => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Manually update the updated_at timestamp
   * Used for: If you need to manually bump a conversation (usually handled by trigger)
   */
  touch: async (conversationId: string): Promise<Conversation> => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};