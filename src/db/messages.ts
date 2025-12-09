// src/db/messages.ts
import supabase from '../../utils/supabase';
import type { MessageWithSender } from '../types/database.types';

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
};
