// src/db/participants.ts
import supabase from '../../utils/supabase';

export const participantsDb = {
  /**
   * Mark a conversation as read by updating last_read_at to current time
   * Used for: Clearing unread indicators when user views a conversation
   *
   * @param conversationId - The conversation to mark as read
   * @param userId - The user who is reading the conversation
   */
  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
