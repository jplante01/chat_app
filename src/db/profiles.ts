// src/db/profiles.ts
import supabase from '../../utils/supabase';
import type { Profile } from '../types/database.types';

export const profilesDb = {
  /**
   * Get a single profile by user ID
   * Used for: Displaying user profile information
   */
  getById: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Search for users by username (case-insensitive)
   * Used for: Finding users when creating new conversations
   * Excludes the specified user ID from results
   */
  search: async (query: string, excludeUserId?: string): Promise<Profile[]> => {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .order('username', { ascending: true })
      .limit(20);

    if (excludeUserId) {
      queryBuilder = queryBuilder.neq('id', excludeUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  },
};
