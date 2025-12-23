import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'
import { participantsDb, conversationsDb } from '../../src/db'

describe('Participants - Mark As Read', () => {
  // Generate unique IDs for this test suite
  const USER_A_ID = crypto.randomUUID()
  const USER_B_ID = crypto.randomUUID()
  let CONVERSATION_ID: string

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_A_ID,
      email: `userA_${USER_A_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userA_${USER_A_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_B_ID,
      email: `userB_${USER_B_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userB_${USER_B_ID.substring(0, 8)}` }
    })

    // Create a conversation between User A and User B
    const conversation = await conversationsDb.create([USER_A_ID, USER_B_ID])
    CONVERSATION_ID = conversation.id

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it('should update last_read_at when marking conversation as read', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get initial last_read_at for User A
    const { data: before } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_A_ID)
      .single()

    const initialTimestamp = before?.last_read_at

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100))

    // Mark as read
    await participantsDb.markAsRead(CONVERSATION_ID, USER_A_ID)

    // Get updated last_read_at
    const { data: after } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_A_ID)
      .single()

    const updatedTimestamp = after?.last_read_at

    // Verify timestamp was updated
    expect(updatedTimestamp).toBeDefined()
    expect(new Date(updatedTimestamp!).getTime()).toBeGreaterThan(
      new Date(initialTimestamp!).getTime()
    )
  })

  it('should only update last_read_at for specified user', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get User B's last_read_at before User A marks as read
    const { data: beforeB } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_B_ID)
      .single()

    const userBTimestampBefore = beforeB?.last_read_at

    // User A marks conversation as read
    await participantsDb.markAsRead(CONVERSATION_ID, USER_A_ID)

    // Get User B's last_read_at after User A marks as read
    const { data: afterB } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_ID)
      .eq('user_id', USER_B_ID)
      .single()

    const userBTimestampAfter = afterB?.last_read_at

    // User B's timestamp should not have changed
    expect(userBTimestampAfter).toBe(userBTimestampBefore)
  })

  it('should only update for specified conversation', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create another conversation with User A
    const USER_C_ID = crypto.randomUUID()

    await adminSupabase.auth.admin.createUser({
      id: USER_C_ID,
      email: `userC_${USER_C_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userC_${USER_C_ID.substring(0, 8)}` }
    })

    const conversation2 = await conversationsDb.create([USER_A_ID, USER_C_ID])
    const CONVERSATION_2_ID = conversation2.id

    // Get User A's last_read_at in conversation 2 before marking conversation 1 as read
    const { data: before } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_2_ID)
      .eq('user_id', USER_A_ID)
      .single()

    const conversation2TimestampBefore = before?.last_read_at

    // Mark conversation 1 as read
    await participantsDb.markAsRead(CONVERSATION_ID, USER_A_ID)

    // Get User A's last_read_at in conversation 2 after marking conversation 1 as read
    const { data: after } = await adminSupabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', CONVERSATION_2_ID)
      .eq('user_id', USER_A_ID)
      .single()

    const conversation2TimestampAfter = after?.last_read_at

    // Conversation 2's timestamp should not have changed
    expect(conversation2TimestampAfter).toBe(conversation2TimestampBefore)
  })

  it('should handle non-existent conversation gracefully', async () => {
    const fakeConversationId = crypto.randomUUID()

    // Should not throw error even if conversation doesn't exist
    await expect(
      participantsDb.markAsRead(fakeConversationId, USER_A_ID)
    ).resolves.not.toThrow()
  })

  it('should handle non-existent user gracefully', async () => {
    const fakeUserId = crypto.randomUUID()

    // Should not throw error even if user doesn't exist in conversation
    await expect(
      participantsDb.markAsRead(CONVERSATION_ID, fakeUserId)
    ).resolves.not.toThrow()
  })
})
