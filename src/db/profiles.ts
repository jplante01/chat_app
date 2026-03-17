// src/db/profiles.ts
import supabase from '../../utils/supabase';
import type { Profile } from '../types/database.types';
import { optimizeImage } from '../utils/optimizeImage';

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

  /**
   * Optimize and upload a new avatar to storage.
   * The DB trigger on storage.objects automatically updates profiles.avatar_url.
   * Returns the storage path (not a full URL).
   */
  updateAvatar: async (userId: string, file: File): Promise<string> => {
    const optimized = await optimizeImage(file);
    const path = `${userId}.webp`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, optimized, { upsert: true, contentType: 'image/webp' });

    if (error) throw error;
    return path;
  },
};
