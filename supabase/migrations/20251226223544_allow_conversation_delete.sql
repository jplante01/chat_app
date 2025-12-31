-- Allow users to delete conversations they are participating in
-- This enables the delete conversation feature where users can remove
-- entire conversations (including all messages and participants)

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (
    public.is_conversation_participant(id, auth.uid())
  );

COMMENT ON POLICY "Users can delete own conversations" ON conversations IS
  'Users can delete conversations they are participating in. CASCADE will remove all participants and messages.';
