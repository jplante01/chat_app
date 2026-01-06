import { createClient } from '@supabase/supabase-js';
import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { conversationsDb, messagesDb } from '../../src/db';

/**
 * NOTE: Realtime Subscription Testing Limitations
 *
 * These tests are currently SKIPPED because Supabase Realtime postgres_changes
 * events are not reliably broadcasted in the local development environment.
 *
 * Issues encountered:
 * - PoolingReplicationError in Realtime server logs
 * - Query timeouts when listing changes
 * - Events not reaching subscription callbacks despite active replication slots
 *
 * The underlying database functionality (triggers, timestamps, publications) is
 * tested in other test files and works correctly. Subscription hooks should be
 * tested manually during development using the application UI.
 *
 * References:
 * - Supabase docs don't provide examples of testing postgres_changes locally
 * - Realtime Inspector: http://localhost:4000/inspector/new (for manual testing)
 */

describe.skip('Subscriptions - Messages', () => {
  // Generate unique IDs for this test suite
  const USER_1_ID = crypto.randomUUID();
  const USER_2_ID = crypto.randomUUID();
  let CONVERSATION_ID: string;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_ROLE_KEY) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  // Create client for subscriptions (using service role key to bypass RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const activeChannels: any[] = [];

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `user1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user1_${USER_1_ID.substring(0, 8)}` },
    });

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `user2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user2_${USER_2_ID.substring(0, 8)}` },
    });

    // Create a conversation
    const conversation = await conversationsDb.create([USER_1_ID, USER_2_ID]);
    CONVERSATION_ID = conversation.id;
  });

  afterEach(async () => {
    // Clean up all channels after each test
    for (const channel of activeChannels) {
      await supabase.removeChannel(channel);
    }
    activeChannels.length = 0;
  });

  it('should receive INSERT event when message is created', async () => {
    let receivedPayload: any = null;

    // Set up subscription
    const channel = supabase
      .channel(`test-messages-insert-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${CONVERSATION_ID}`,
        },
        (payload) => {
          receivedPayload = payload;
        }
      )
      .subscribe();

    activeChannels.push(channel);

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Insert a message
    const messageContent = `Test message ${Date.now()}`;
    await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: messageContent,
    });

    // Wait for event to be received
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify we received the event
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.eventType).toBe('INSERT');
    expect(receivedPayload.new.conversation_id).toBe(CONVERSATION_ID);
    expect(receivedPayload.new.sender_id).toBe(USER_1_ID);
    expect(receivedPayload.new.content).toBe(messageContent);
  });

  it('should receive UPDATE event when message is updated', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create a message first
    const message = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Original content',
    });

    let receivedPayload: any = null;
    let eventReceived: Promise<void>;

    // Set up subscription and wait for it to be ready
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = supabase
          .channel(`test-messages-update-${crypto.randomUUID()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${CONVERSATION_ID}`,
            },
            (payload) => {
              receivedPayload = payload;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;

    // Update the message
    const updatedContent = `Updated content ${Date.now()}`;
    await adminSupabase
      .from('messages')
      .update({ content: updatedContent, edited: true })
      .eq('id', message.id);

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subscription timeout - no event received')), 3000)
      ),
    ]);

    // Verify we received the event
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.eventType).toBe('UPDATE');
    expect(receivedPayload.new.content).toBe(updatedContent);
    expect(receivedPayload.new.edited).toBe(true);
  }, 10000);

  it('should only receive events for filtered conversation', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create another conversation
    const USER_3_ID = crypto.randomUUID();
    await adminSupabase.auth.admin.createUser({
      id: USER_3_ID,
      email: `user3_${USER_3_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user3_${USER_3_ID.substring(0, 8)}` },
    });

    const conversation2 = await conversationsDb.create([USER_1_ID, USER_3_ID]);
    const CONVERSATION_2_ID = conversation2.id;

    let receivedPayload: any = null;
    let eventCount = 0;
    let eventReceived: Promise<void>;

    // Subscribe to CONVERSATION_ID only and wait for it to be ready
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = supabase
          .channel(`test-messages-filter-${crypto.randomUUID()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${CONVERSATION_ID}`, // Only CONVERSATION_ID
            },
            (payload) => {
              receivedPayload = payload;
              eventCount++;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;

    // Insert message in CONVERSATION_2 (should NOT trigger our subscription)
    await messagesDb.create({
      conversation_id: CONVERSATION_2_ID,
      sender_id: USER_1_ID,
      content: 'Message in conversation 2',
    });

    // Wait a bit to ensure no event comes through
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Insert message in CONVERSATION_ID (SHOULD trigger our subscription)
    await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Message in conversation 1',
    });

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subscription timeout - no event received')), 3000)
      ),
    ]);

    // Verify we only received one event (from CONVERSATION_ID)
    expect(eventCount).toBe(1);
    expect(receivedPayload.new.conversation_id).toBe(CONVERSATION_ID);
    expect(receivedPayload.new.content).toBe('Message in conversation 1');
  }, 10000);
});

describe.skip('Subscriptions - Conversations', () => {
  // Generate unique IDs for this test suite
  const USER_A_ID = crypto.randomUUID();
  const USER_B_ID = crypto.randomUUID();
  let CONVERSATION_ID: string;

  // Use process.env for test environment compatibility
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_ROLE_KEY) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  // Create client for subscriptions (using service role key to bypass RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const activeChannels: any[] = [];

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_A_ID,
      email: `userA_${USER_A_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userA_${USER_A_ID.substring(0, 8)}` },
    });

    await adminSupabase.auth.admin.createUser({
      id: USER_B_ID,
      email: `userB_${USER_B_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userB_${USER_B_ID.substring(0, 8)}` },
    });

    // Create a conversation
    const conversation = await conversationsDb.create([USER_A_ID, USER_B_ID]);
    CONVERSATION_ID = conversation.id;
  });

  afterEach(async () => {
    // Clean up all channels after each test
    for (const channel of activeChannels) {
      await supabase.removeChannel(channel);
    }
    activeChannels.length = 0;
  });

  it('should receive UPDATE event when conversation updated_at changes', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let receivedPayload: any = null;
    let eventReceived: Promise<void>;

    // Set up subscription and wait for it to be ready
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = supabase
          .channel(`test-conversations-update-${crypto.randomUUID()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversations',
              filter: `id=eq.${CONVERSATION_ID}`,
            },
            (payload) => {
              receivedPayload = payload;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;

    // Insert a message (triggers update_conversation_timestamp trigger)
    await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_A_ID,
      content: 'Message that triggers conversation update',
    });

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subscription timeout - no event received')), 3000)
      ),
    ]);

    // Verify we received the event
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.eventType).toBe('UPDATE');
    expect(receivedPayload.new.id).toBe(CONVERSATION_ID);

    // Verify updated_at changed
    expect(receivedPayload.old.updated_at).toBeDefined();
    expect(receivedPayload.new.updated_at).toBeDefined();
    expect(new Date(receivedPayload.new.updated_at).getTime()).toBeGreaterThan(
      new Date(receivedPayload.old.updated_at).getTime()
    );
  }, 10000);

  it('should receive UPDATE event when participant last_read_at changes', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let receivedPayload: any = null;
    let eventReceived: Promise<void>;

    // Set up subscription and wait for it to be ready
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = supabase
          .channel(`test-participants-update-${crypto.randomUUID()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversation_participants',
              filter: `conversation_id=eq.${CONVERSATION_ID}`,
            },
            (payload) => {
              receivedPayload = payload;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;

    // Update last_read_at for User A
    await adminSupabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_A_ID);

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subscription timeout - no event received')), 3000)
      ),
    ]);

    // Verify we received the event
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.eventType).toBe('UPDATE');
    expect(receivedPayload.new.conversation_id).toBe(CONVERSATION_ID);
    expect(receivedPayload.new.user_id).toBe(USER_A_ID);

    // Verify last_read_at changed
    expect(new Date(receivedPayload.new.last_read_at).getTime()).toBeGreaterThan(
      new Date(receivedPayload.old.last_read_at).getTime()
    );
  }, 10000);
});

/**
 * Test realtime notifications with authenticated users
 *
 * This test verifies that when User A creates or deletes a conversation,
 * User B receives realtime notifications via their authenticated subscription.
 *
 * This tests the actual RLS policies and realtime event broadcasting
 * using authenticated clients (not admin/service role).
 */
describe('Realtime Notifications - Authenticated Users', () => {
  const USER_A_ID = crypto.randomUUID();
  const USER_B_ID = crypto.randomUUID();

  const USER_A_EMAIL = `userA_${USER_A_ID.substring(0, 8)}@test.com`;
  const USER_B_EMAIL = `userB_${USER_B_ID.substring(0, 8)}@test.com`;
  const PASSWORD = 'password123';

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!ANON_KEY) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  let userAClient: ReturnType<typeof createClient>;
  let userBClient: ReturnType<typeof createClient>;
  const activeChannels: any[] = [];

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_A_ID,
      email: USER_A_EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: `userA_${USER_A_ID.substring(0, 8)}` },
    });

    await adminSupabase.auth.admin.createUser({
      id: USER_B_ID,
      email: USER_B_EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: `userB_${USER_B_ID.substring(0, 8)}` },
    });

    // Create authenticated clients for each user
    userAClient = createClient(SUPABASE_URL, ANON_KEY);
    userBClient = createClient(SUPABASE_URL, ANON_KEY);

    // Sign in as User A
    const { error: errorA } = await userAClient.auth.signInWithPassword({
      email: USER_A_EMAIL,
      password: PASSWORD,
    });
    if (errorA) throw errorA;

    // Sign in as User B
    const { error: errorB } = await userBClient.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: PASSWORD,
    });
    if (errorB) throw errorB;
  });

  afterEach(async () => {
    // Clean up all channels after each test
    for (const channel of activeChannels) {
      await channel.unsubscribe();
    }
    activeChannels.length = 0;
  });

  it('should notify User B when User A creates a conversation', async () => {
    let receivedPayload: any = null;
    let eventReceived: Promise<void>;

    console.log('[Test] Setting up User B broadcast subscription...');

    // User B subscribes to their broadcast topic
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = userBClient
          .channel(`user:${USER_B_ID}`, { config: { private: true } }) // Private broadcasts require private:true
          .on(
            'broadcast',
            { event: 'INSERT' }, // Event must match event_name from broadcast (TG_OP)
            (payload) => {
              console.log('[Test] User B received broadcast event:', payload);

              // Extract the actual data from the broadcast payload
              receivedPayload = payload;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            console.log('[Test] User B subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;
    console.log('[Test] User B subscription ready');

    // User A creates a conversation with User B
    console.log('[Test] User A creating conversation...');
    const { data: conversation, error } = await userAClient.rpc(
      'create_conversation_with_participants',
      {
        participant_ids: [USER_A_ID, USER_B_ID],
      } as any
    );

    if (error) {
      console.error('[Test] Error creating conversation:', error);
      throw error;
    }

    console.log('[Test] Conversation created:', conversation);

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Subscription timeout - User B did not receive INSERT event')),
          5000
        )
      ),
    ]);

    // Verify User B received the INSERT event
    expect(receivedPayload).toBeDefined();
    console.log('[Test] Payload structure:', JSON.stringify(receivedPayload, null, 2));

    console.log('[Test] ✓ User B successfully received conversation creation notification');
  }, 10000);

  it('should notify User B when User A deletes a conversation', async () => {
    // First, User A creates a conversation
    console.log('[Test] User A creating conversation for deletion test...');
    const { data: conversationId, error: createError } = await userAClient.rpc(
      'create_conversation_with_participants',
      {
        participant_ids: [USER_A_ID, USER_B_ID],
      } as any
    );

    if (createError) throw createError;
    console.log('[Test] Conversation created:', conversationId);

    // Wait a bit to ensure creation is complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    let receivedPayload: any = null;
    let eventReceived: Promise<void>;

    console.log('[Test] Setting up User B broadcast subscription for DELETE events...');

    // User B subscribes to their broadcast topic for DELETE events
    const subscriptionReady = new Promise<void>((resolve) => {
      eventReceived = new Promise<void>((resolveEvent) => {
        const channel = userBClient
          .channel(`user:${USER_B_ID}`, { config: { private: true } }) // Private broadcasts require private:true
          .on(
            'broadcast',
            { event: 'DELETE' }, // Event must match event_name from broadcast (TG_OP)
            (payload) => {
              console.log('[Test] User B received broadcast event:', payload);

              // Extract the actual data from the broadcast payload
              receivedPayload = payload;
              resolveEvent();
            }
          )
          .subscribe((status) => {
            console.log('[Test] User B DELETE subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });

        activeChannels.push(channel);
      });
    });

    // Wait for subscription to be established
    await subscriptionReady;
    console.log('[Test] User B DELETE subscription ready');

    // User A deletes the conversation
    console.log('[Test] User A deleting conversation...');
    const { error: deleteError } = await userAClient.rpc('delete_conversation_and_notify', {
      conversation_id: conversationId,
    } as any);

    if (deleteError) {
      console.error('[Test] Error deleting conversation:', deleteError);
      throw deleteError;
    }

    console.log('[Test] Conversation deleted');

    // Wait for event with timeout
    await Promise.race([
      eventReceived!,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Subscription timeout - User B did not receive DELETE event')),
          5000
        )
      ),
    ]);

    // Verify User B received the DELETE event
    expect(receivedPayload).toBeDefined();
    console.log('[Test] DELETE Payload structure:', JSON.stringify(receivedPayload, null, 2));

    console.log('[Test] ✓ User B successfully received conversation deletion notification');
  }, 15000);
});
