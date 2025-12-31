-- Enable DELETE events for Realtime subscriptions
-- By default, Postgres publications only publish INSERT and UPDATE events.
-- Setting REPLICA IDENTITY FULL allows DELETE events to be published with full row data,
-- which Supabase Realtime needs to broadcast them to subscribers.

-- Enable DELETE events for conversation_participants table
-- This allows real-time subscriptions to receive notifications when:
-- - A user is removed from a conversation
-- - A conversation is deleted (CASCADE deletes participant records)
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;

-- Enable DELETE events for conversations table
-- This allows subscriptions to receive notifications when conversations are deleted
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Enable DELETE events for messages table
-- This allows subscriptions to receive notifications when messages are deleted
ALTER TABLE messages REPLICA IDENTITY FULL;

COMMENT ON TABLE conversation_participants IS
  'REPLICA IDENTITY FULL enabled to broadcast DELETE events via Realtime';

COMMENT ON TABLE conversations IS
  'REPLICA IDENTITY FULL enabled to broadcast DELETE events via Realtime';

COMMENT ON TABLE messages IS
  'REPLICA IDENTITY FULL enabled to broadcast DELETE events via Realtime';
