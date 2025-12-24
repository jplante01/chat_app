CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participants in each conversation
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- for soft deletes
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for query performance
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_not_deleted ON messages(conversation_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Optimized index for fetching latest message per conversation (covering index)
-- This supports lateral joins when displaying conversation lists with message previews
CREATE INDEX idx_messages_latest_per_conversation
ON messages(conversation_id, created_at DESC, sender_id)
WHERE deleted_at IS NULL;

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_conversation_timestamp();

-- Function to create profile when user signs up
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to check if a user is a participant in a conversation
-- Used by RLS policies to verify access to conversation data
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = is_conversation_participant.conversation_id
      AND conversation_participants.user_id = is_conversation_participant.user_id
  );
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_conversation_participant IS
  'Check if a user is a participant in a conversation. Used by RLS policies.';

-- Function to atomically create a conversation with participants
-- This ensures both the conversation and all participants are created in a single transaction
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(participant_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Validate input
  IF participant_ids IS NULL OR array_length(participant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'participant_ids cannot be null or empty';
  END IF;

  IF array_length(participant_ids, 1) < 2 THEN
    RAISE EXCEPTION 'At least 2 participants are required';
  END IF;

  -- Security check: ensure the calling user is included in the participants list
  IF NOT (auth.uid() = ANY(participant_ids)) THEN
    RAISE EXCEPTION 'You must be a participant in the conversation you are creating';
  END IF;

  -- Insert conversation (generates UUID automatically)
  INSERT INTO public.conversations DEFAULT VALUES
  RETURNING id INTO conversation_id;

  -- Insert all participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, participant_id);
  END LOOP;

  -- Return the conversation ID
  RETURN conversation_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION create_conversation_with_participants IS
  'Atomically creates a conversation with the specified participants. Returns the conversation ID.';

-- Enable Realtime for real-time updates, 
-- Necessary to use supabase channels to monitor postgres changes 
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;