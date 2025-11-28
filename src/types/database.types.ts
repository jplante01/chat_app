// src/types/database.types.ts
import { Database } from './supabase';

// Extract table row types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];

// Types for inserts (useful for forms)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

// Types for updates
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Composite types for queries with joins
export type MessageWithSender = Message & {
  sender: Profile;
};

export type ConversationWithParticipants = Conversation & {
  participants: ConversationParticipant[];
};

export type ConversationListItem = Conversation & {
  participants: (ConversationParticipant & {
    profile: Profile;
  })[];
  latest_message?: Message;
};