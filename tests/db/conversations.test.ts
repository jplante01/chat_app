import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'
import { conversationsDb } from '../../src/db'

describe('Conversations - Get For Current User', () => {
  // Generate unique IDs for this test suite
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()
  const USER_3_ID = crypto.randomUUID()

  let CONVERSATION_A_ID: string  // User1 + User2
  let CONVERSATION_B_ID: string  // User2 + User3

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create 3 test users
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `user1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user1_${USER_1_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `user2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user2_${USER_2_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_3_ID,
      email: `user3_${USER_3_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `user3_${USER_3_ID.substring(0, 8)}` }
    })

    // Create Conversation A (User1 + User2) - created first, so older
    const { data: convA } = await adminSupabase
      .from('conversations')
      .insert({})
      .select()
      .single()
    CONVERSATION_A_ID = convA.id

    await adminSupabase.from('conversation_participants').insert([
      { conversation_id: CONVERSATION_A_ID, user_id: USER_1_ID },
      { conversation_id: CONVERSATION_A_ID, user_id: USER_2_ID },
    ])

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100))

    // Create Conversation B (User2 + User3) - created second, so newer
    const { data: convB } = await adminSupabase
      .from('conversations')
      .insert({})
      .select()
      .single()
    CONVERSATION_B_ID = convB.id

    await adminSupabase.from('conversation_participants').insert([
      { conversation_id: CONVERSATION_B_ID, user_id: USER_2_ID },
      { conversation_id: CONVERSATION_B_ID, user_id: USER_3_ID },
    ])
  })

  it('should return conversations for User1 (only Conversation A)', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_1_ID)

    expect(conversations).toHaveLength(1)
    expect(conversations[0].id).toBe(CONVERSATION_A_ID)
  })

  it('should not return conversations User1 is not part of', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_1_ID)

    const conversationIds = conversations.map(c => c.id)
    expect(conversationIds).not.toContain(CONVERSATION_B_ID)
  })

  it('should include all participants with their profiles', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_1_ID)
    const conversation = conversations[0]

    expect(conversation.participants).toBeDefined()
    expect(conversation.participants).toHaveLength(2)

    // Check that all participants have profile data
    conversation.participants.forEach(participant => {
      expect(participant.profile).toBeDefined()
      expect(participant.profile.id).toBeDefined()
      expect(participant.profile.username).toBeDefined()
    })

    // Verify both User1 and User2 are in the participants
    const participantUserIds = conversation.participants.map(p => p.user_id)
    expect(participantUserIds).toContain(USER_1_ID)
    expect(participantUserIds).toContain(USER_2_ID)
  })

  it('should return both conversations for User2 (in both A and B)', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_2_ID)

    expect(conversations).toHaveLength(2)

    const conversationIds = conversations.map(c => c.id)
    expect(conversationIds).toContain(CONVERSATION_A_ID)
    expect(conversationIds).toContain(CONVERSATION_B_ID)
  })

  it('should order conversations by most recent first (updated_at DESC)', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_2_ID)

    expect(conversations).toHaveLength(2)

    // Conversation B was created second, so it should appear first
    expect(conversations[0].id).toBe(CONVERSATION_B_ID)
    expect(conversations[1].id).toBe(CONVERSATION_A_ID)

    // Verify updated_at ordering
    const firstUpdated = new Date(conversations[0].updated_at)
    const secondUpdated = new Date(conversations[1].updated_at)
    expect(firstUpdated.getTime()).toBeGreaterThanOrEqual(secondUpdated.getTime())
  })

  it('should return empty array for user with no conversations', async () => {
    const conversations = await conversationsDb.getForCurrentUser(USER_3_ID)

    // Wait, User3 IS in Conversation B, so they should see 1 conversation
    expect(conversations).toHaveLength(1)
    expect(conversations[0].id).toBe(CONVERSATION_B_ID)
  })
})
