// src/db/profiles.ts
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/database.types';

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
   * Get multiple profiles by their IDs
   * Used for: Loading participant profiles in a conversation
   */
  getByIds: async (userIds: string[]): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data;
  },

  /**
   * Get all profiles except the current user
   * Used for: Showing a list of users to start a new conversation with
   */
  getAllExceptCurrent: async (currentUserId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .order('username', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Search profiles by username
   * Used for: Search functionality when starting a new chat
   */
  searchByUsername: async (searchTerm: string): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (error) throw error;
    return data;
  },

  /**
   * Update the current user's profile
   * Used for: Profile settings page
   */
  update: async (userId: string, updates: ProfileUpdate): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user's online status
   * Used for: Setting status when user goes online/offline/away
   */
  updateStatus: async (
    userId: string,
    status: 'online' | 'offline' | 'away'
  ): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        status,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update last_seen timestamp
   * Used for: Tracking when user was last active
   */
  updateLastSeen: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },
};