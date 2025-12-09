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
};
