// src/db/participants.ts
import supabase from '../../utils/supabase';
import type { ConversationParticipant } from '../types/database.types';

export const participantsDb = {
  /**
   * Get all participants in a conversation with their profile details
   * Used for: Displaying who's in the conversation, showing avatars
   */
  getByConversation: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('conversation_id', conversationId);

    if (error) throw error;
    return data;
  },

  /**
   * Get all conversations a specific user is part of
   * Used for: Finding which conversations belong to a user
   */
  getByUser: async (userId: string): Promise<ConversationParticipant[]> => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  /**
   * Add a single participant to a conversation
   * Used for: Adding someone to an existing conversation
   */
  add: async (
    conversationId: string,
    userId: string
  ): Promise<ConversationParticipant> => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add multiple participants to a conversation at once
   * Used for: Creating a new group conversation with multiple people
   */
  addMultiple: async (
    conversationId: string,
    userIds: string[]
  ): Promise<ConversationParticipant[]> => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .insert(
        userIds.map((userId) => ({
          conversation_id: conversationId,
          user_id: userId,
        }))
      )
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a participant from a conversation
   * Used for: Leaving a conversation or removing someone from a group
   */
  remove: async (conversationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Update when a user last read messages in a conversation
   * Used for: Marking messages as read, showing unread indicators
   */
  updateLastRead: async (
    conversationId: string,
    userId: string
  ): Promise<ConversationParticipant> => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if a user is a participant in a conversation
   * Used for: Authorization checks before showing conversation content
   */
  isUserInConversation: async (
    conversationId: string,
    userId: string
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  },
};