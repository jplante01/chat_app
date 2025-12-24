/**
 * Proof of Concept: RLS Testing with Authenticated Clients
 *
 * This test verifies the pattern of using authenticated clients
 * instead of SERVICE_ROLE_KEY to test RLS policies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'

describe('RLS POC - Authenticated Client Pattern', () => {
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()
  let CONVERSATION_ID: string

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  // Authenticated clients
  let user1Client: SupabaseClient
  let user2Client: SupabaseClient

  beforeAll(async () => {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create User 1
    await adminClient.auth.admin.createUser({
      id: USER_1_ID,
      email: `user1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user1_${USER_1_ID.substring(0, 8)}` }
    })

    // Create User 2
    await adminClient.auth.admin.createUser({
      id: USER_2_ID,
      email: `user2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user2_${USER_2_ID.substring(0, 8)}` }
    })

    // Create conversation with participants (using admin to bypass RLS for setup)
    const { data: conversation } = await adminClient
      .from('conversations')
      .insert({})
      .select()
      .single()
    CONVERSATION_ID = conversation!.id

    await adminClient.from('conversation_participants').insert([
      { conversation_id: CONVERSATION_ID, user_id: USER_1_ID },
      { conversation_id: CONVERSATION_ID, user_id: USER_2_ID },
    ])

    // Create authenticated clients for each user
    user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    user2Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Sign in as User 1
    const { error: signInError1 } = await user1Client.auth.signInWithPassword({
      email: `user1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
    })
    if (signInError1) throw signInError1

    // Sign in as User 2
    const { error: signInError2 } = await user2Client.auth.signInWithPassword({
      email: `user2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
    })
    if (signInError2) throw signInError2
  })

  afterAll(async () => {
    // Clean up auth sessions
    await user1Client?.auth.signOut()
    await user2Client?.auth.signOut()
  })

  it('should allow User 1 to view their own conversations', async () => {
    const { data, error } = await user1Client
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', USER_1_ID)

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data).toHaveLength(1)
    expect(data![0].conversation_id).toBe(CONVERSATION_ID)
  })

  it('should allow User 1 to see messages in their conversation', async () => {
    // First, insert a message as User 1
    const { data: message, error: insertError } = await user1Client
      .from('messages')
      .insert({
        conversation_id: CONVERSATION_ID,
        sender_id: USER_1_ID,
        content: 'Test message from User 1',
      })
      .select()
      .single()

    expect(insertError).toBeNull()
    expect(message).toBeDefined()

    // Now try to read it back
    const { data: messages, error: selectError } = await user1Client
      .from('messages')
      .select('*')
      .eq('conversation_id', CONVERSATION_ID)

    expect(selectError).toBeNull()
    expect(messages).toBeDefined()
    expect(messages!.length).toBeGreaterThan(0)
  })

  it('should prevent User 1 from sending messages as User 2', async () => {
    const { data, error } = await user1Client
      .from('messages')
      .insert({
        conversation_id: CONVERSATION_ID,
        sender_id: USER_2_ID, // Trying to impersonate User 2
        content: 'Fake message',
      })
      .select()

    // This should fail due to RLS policy checking sender_id = auth.uid()
    expect(error).toBeDefined()
    expect(error?.message).toContain('new row violates row-level security policy')
  })

  it('should allow User 1 to update only their own participant record', async () => {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get User 2's original last_read_at timestamp
    const { data: beforeData } = await adminClient
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_2_ID)
      .single()

    const originalTimestamp = beforeData!.last_read_at

    // User 1 updates their own last_read_at (should succeed)
    const { error: ownUpdateError } = await user1Client
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_1_ID)

    expect(ownUpdateError).toBeNull()

    // User 1 tries to update User 2's last_read_at (should be blocked by RLS)
    const newTimestamp = new Date().toISOString()
    const { data: updateData, error: otherUpdateError } = await user1Client
      .from('conversation_participants')
      .update({ last_read_at: newTimestamp })
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_2_ID)
      .select()

    // RLS blocks this - no error, just 0 rows affected
    expect(otherUpdateError).toBeNull()
    expect(updateData).toEqual([]) // No rows returned = no rows updated

    // Verify User 2's record wasn't actually updated
    const { data: afterData } = await adminClient
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_2_ID)
      .single()

    // Timestamp should be unchanged
    expect(afterData!.last_read_at).toBe(originalTimestamp)
  })

  it('should prevent User 1 from viewing conversations they are not part of', async () => {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create a conversation that User 1 is NOT part of
    const USER_3_ID = crypto.randomUUID()
    await adminClient.auth.admin.createUser({
      id: USER_3_ID,
      email: `user3_${USER_3_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user3_${USER_3_ID.substring(0, 8)}` }
    })

    const { data: privateConv } = await adminClient
      .from('conversations')
      .insert({})
      .select()
      .single()

    await adminClient.from('conversation_participants').insert([
      { conversation_id: privateConv!.id, user_id: USER_2_ID },
      { conversation_id: privateConv!.id, user_id: USER_3_ID },
    ])

    // User 1 tries to read this private conversation
    const { data, error } = await user1Client
      .from('conversations')
      .select('*')
      .eq('id', privateConv!.id)
      .single()

    // Should return empty or error due to RLS
    expect(data).toBeNull()
    expect(error).toBeDefined()
  })

  it('should allow both users to view profiles (public data)', async () => {
    const { data: user1Profiles, error: error1 } = await user1Client
      .from('profiles')
      .select('*')

    expect(error1).toBeNull()
    expect(user1Profiles).toBeDefined()
    expect(user1Profiles!.length).toBeGreaterThan(0)

    const { data: user2Profiles, error: error2 } = await user2Client
      .from('profiles')
      .select('*')

    expect(error2).toBeNull()
    expect(user2Profiles).toBeDefined()
    expect(user2Profiles!.length).toBeGreaterThan(0)
  })
})
