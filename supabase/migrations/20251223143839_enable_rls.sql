-- Enable Row Level Security (RLS) on all tables
-- This migration adds security policies to ensure users can only access data they're authorized to see

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Allow all authenticated users to view all profiles (needed for user search)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Note: INSERT is handled by the handle_new_user() trigger (SECURITY DEFINER)
-- Note: DELETE is handled by CASCADE from auth.users

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Allow users to view conversations they are participating in
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_participant(id, auth.uid())
  );

-- Note: INSERT is handled by create_conversation_with_participants() RPC (SECURITY DEFINER)
-- Note: UPDATE/DELETE not needed - conversations are immutable

-- =====================================================
-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- =====================================================

-- Allow users to view participants in conversations they're part of
CREATE POLICY "Users can view participants in own conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Allow users to update their own participant record (for last_read_at)
CREATE POLICY "Users can update own participant record"
  ON conversation_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: INSERT is handled by create_conversation_with_participants() RPC (SECURITY DEFINER)
-- Note: DELETE not needed - handled by CASCADE

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Allow users to view messages in conversations they're participating in
CREATE POLICY "Users can view messages in own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Allow users to send messages to conversations they're participating in
CREATE POLICY "Users can send messages to own conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a participant of the conversation
    public.is_conversation_participant(conversation_id, auth.uid())
    -- User must be the sender of the message
    AND sender_id = auth.uid()
  );

-- Allow users to update only their own messages (for editing)
CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Allow users to delete only their own messages (soft delete via deleted_at)
CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- =====================================================
-- SECURITY DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view all profiles" ON profiles IS
  'Allow all authenticated users to search for and view user profiles';

COMMENT ON POLICY "Users can update own profile" ON profiles IS
  'Users can only update their own profile data';

COMMENT ON POLICY "Users can view own conversations" ON conversations IS
  'Users can only see conversations they are participating in';

COMMENT ON POLICY "Users can view participants in own conversations" ON conversation_participants IS
  'Users can see all participants in conversations they are part of';

COMMENT ON POLICY "Users can update own participant record" ON conversation_participants IS
  'Users can update their own last_read_at timestamp to mark conversations as read';

COMMENT ON POLICY "Users can view messages in own conversations" ON messages IS
  'Users can only see messages in conversations they are participating in';

COMMENT ON POLICY "Users can send messages to own conversations" ON messages IS
  'Users can send messages to conversations they participate in, and must set themselves as sender';

COMMENT ON POLICY "Users can update own messages" ON messages IS
  'Users can edit only messages they sent';

COMMENT ON POLICY "Users can delete own messages" ON messages IS
  'Users can delete only messages they sent (soft delete recommended via deleted_at column)';
