-- Enable Supabase Realtime broadcast for conversation and message notifications
--
-- This migration switches from postgres_changes subscriptions to Realtime broadcast.
--
-- Why broadcast instead of postgres_changes:
-- - postgres_changes relies on RLS policy evaluation to determine who receives events
-- - Complex RLS policies (like is_conversation_participant) cause circular dependencies
-- - SECURITY DEFINER functions conflict with RLS evaluation during realtime events
-- - Broadcast explicitly controls who receives events via topics, bypassing RLS complexity
--
-- How it works:
-- 1. Triggers fire on INSERT/UPDATE/DELETE of conversation_participants and messages
-- 2. Triggers call realtime.broadcast_changes() to send events to user-specific topics
-- 3. Frontend subscribes to broadcast events on topic 'user:{user_id}'
-- 4. Events trigger React Query cache invalidation → UI updates

-- =====================================================
-- STEP 1: Enable Realtime Broadcast Authorization
-- =====================================================

-- Allow authenticated users to receive broadcast messages
-- This is the only RLS policy needed for broadcast to work
CREATE POLICY "Authenticated users can receive broadcasts"
  ON "realtime"."messages"
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Authenticated users can receive broadcasts" ON "realtime"."messages" IS
  'Allows all authenticated users to receive Realtime broadcast events on their subscribed topics.';

-- =====================================================
-- STEP 2: Create Broadcast Functions
-- =====================================================

-- Broadcast conversation_participants changes to affected user
-- Fires on INSERT, UPDATE, or DELETE of conversation_participants
CREATE OR REPLACE FUNCTION public.broadcast_conversation_participant_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Broadcast to the user whose participant record changed
  -- Topic pattern: 'user:{user_id}'
  PERFORM realtime.broadcast_changes(
    'user:' || COALESCE(NEW.user_id, OLD.user_id)::text,  -- topic_name
    TG_OP,                                                  -- event_name
    TG_OP,                                                  -- operation
    TG_TABLE_NAME,                                          -- table_name
    TG_TABLE_SCHEMA,                                        -- table_schema
    NEW,                                                    -- new record
    OLD,                                                    -- old record
    'ROW'                                                   -- level
  );

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.broadcast_conversation_participant_changes IS
  'Broadcasts conversation participant changes (INSERT/UPDATE/DELETE) to affected users via Realtime. Uses broadcast instead of postgres_changes to avoid RLS policy evaluation issues.';

-- Broadcast message changes to all participants in the conversation
-- Fires on INSERT, UPDATE, or DELETE of messages
CREATE OR REPLACE FUNCTION public.broadcast_message_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Find all participants in this conversation
  -- Broadcast to each participant's topic
  FOR participant_record IN
    SELECT user_id
    FROM public.conversation_participants
    WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id)
  LOOP
    PERFORM realtime.broadcast_changes(
      'user:' || participant_record.user_id::text,  -- topic_name
      TG_OP,                                         -- event_name
      TG_OP,                                         -- operation
      TG_TABLE_NAME,                                 -- table_name
      TG_TABLE_SCHEMA,                               -- table_schema
      NEW,                                           -- new record
      OLD,                                           -- old record
      'ROW'                                          -- level
    );
  END LOOP;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.broadcast_message_changes IS
  'Broadcasts message changes (INSERT/UPDATE/DELETE) to all conversation participants via Realtime. Each participant receives the event on their user-specific topic.';

-- =====================================================
-- STEP 3: Create Triggers
-- =====================================================

-- Trigger for conversation_participants changes
CREATE TRIGGER broadcast_conversation_participant_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON public.conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_conversation_participant_changes();

-- Trigger for message changes
CREATE TRIGGER broadcast_message_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_message_changes();

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON TRIGGER broadcast_conversation_participant_changes ON public.conversation_participants IS
  'Broadcasts participant changes to affected users for real-time UI updates';

COMMENT ON TRIGGER broadcast_message_changes ON public.messages IS
  'Broadcasts message changes to all conversation participants for real-time chat updates';
