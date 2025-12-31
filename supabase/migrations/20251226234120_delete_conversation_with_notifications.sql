-- Function to delete a conversation and notify all participants via realtime
--
-- This function explicitly deletes each participant record individually,
-- which triggers realtime DELETE events for each participant's subscription.
-- This ensures all users see the conversation disappear from their list immediately.
--
-- Unlike CASCADE deletes (which bypass realtime events), this approach:
-- 1. Deletes each participant record individually (fires realtime events)
-- 2. Deletes the conversation itself (cleanup)
--
-- Security: Uses SECURITY DEFINER but checks that the calling user is a participant

CREATE OR REPLACE FUNCTION delete_conversation_and_notify(conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: ensure the calling user is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = delete_conversation_and_notify.conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must be a participant to delete this conversation';
  END IF;

  -- Delete all participant records individually
  -- This triggers realtime DELETE events for each participant's subscription
  DELETE FROM conversation_participants
  WHERE conversation_participants.conversation_id = delete_conversation_and_notify.conversation_id;

  -- Delete the conversation itself (cleanup)
  -- Messages are CASCADE deleted automatically
  DELETE FROM conversations
  WHERE id = delete_conversation_and_notify.conversation_id;
END;
$$;

COMMENT ON FUNCTION delete_conversation_and_notify IS
  'Deletes a conversation and all participant records, triggering realtime notifications for each participant. Requires caller to be a participant.';
