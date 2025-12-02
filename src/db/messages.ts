// src/db/messages.ts
import supabase from '../../utils/supabase';
import type { Message, MessageInsert } from '../types/database.types';

export const messagesDb = {
  /**
   * Get all messages in a conversation with sender profile details
   * Used for: Displaying the message history in a chat window
   * Excludes soft-deleted messages and orders chronologically
   */
  getByConversation: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get recent messages in a conversation (for preview)
   * Used for: Showing the last message in conversation list
   */
  getRecentByConversation: async (conversationId: string, limit: number = 1) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get messages with pagination (for infinite scroll)
   * Used for: Loading older messages as user scrolls up
   * Returns messages before a specific timestamp
   */
  getByConversationPaginated: async (
    conversationId: string,
    beforeTimestamp: string,
    limit: number = 50
  ) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .lt('created_at', beforeTimestamp)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get a single message by ID
   * Used for: Loading a specific message (e.g., when replying)
   */
  getById: async (messageId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*),
        reply_to:messages(
          *,
          sender:profiles(*)
        )
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new message
   * Used for: Sending a message in a conversation
   */
  create: async (message: MessageInsert) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select(`
        *,
        sender:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a message's content and mark it as edited
   * Used for: Editing a sent message
   */
  update: async (messageId: string, content: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .update({
        content,
        edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete a message (sets deleted_at timestamp)
   * Used for: Deleting a message (it's hidden but kept in database)
   * Note: Message content is retained for moderation/history
   */
  softDelete: async (messageId: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Hard delete a message (permanently removes from database)
   * Used for: Admin functions or permanent deletion
   * Note: Use sparingly - prefer soft delete
   */
  hardDelete: async (messageId: string): Promise<void> => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  /**
   * Get count of unread messages in a conversation for a user
   * Used for: Showing unread message badges
   * Counts messages sent after user's last_read_at timestamp
   */
  getUnreadCount: async (
    conversationId: string,
    userId: string
  ): Promise<number> => {
    // First get the user's last_read_at timestamp
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) return 0;

    // Count messages sent after that timestamp (excluding user's own messages)
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('deleted_at', null)
      .gt('created_at', participant.last_read_at);

    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Search messages in a conversation
   * Used for: Message search functionality within a chat
   */
  searchInConversation: async (
    conversationId: string,
    searchTerm: string
  ): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },

  /**
   * Get all messages sent by a specific user
   * Used for: User history, admin moderation
   */
  getBySender: async (senderId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', senderId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};