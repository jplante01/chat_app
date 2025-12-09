// src/db/messages.ts
import supabase from '../../utils/supabase';
import type { MessageWithSender, MessageInsert } from '../types/database.types';

export const messagesDb = {
  /**
   * Get all messages in a conversation with sender profile details
   * Used for: Displaying the message history in a chat window
   * Excludes soft-deleted messages and orders chronologically (oldest first)
   */
  getByConversation: async (conversationId: string): Promise<MessageWithSender[]> => {
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
    return data || [];
  },

  /**
   * Create a new message
   * Used for: Sending a message in a conversation
   * Triggers conversation.updated_at to be updated automatically
   */
  create: async (message: MessageInsert): Promise<MessageWithSender> => {
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
};
