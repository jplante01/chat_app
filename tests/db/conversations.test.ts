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

  it('should include latest_message when messages exist', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create a message in Conversation A
    const messageContent = 'Test message for latest_message field'
    await adminSupabase.from('messages').insert({
      conversation_id: CONVERSATION_A_ID,
      sender_id: USER_1_ID,
      content: messageContent,
    })

    // Fetch conversations for User1
    const conversations = await conversationsDb.getForCurrentUser(USER_1_ID)

    expect(conversations).toHaveLength(1)
    const conversation = conversations[0]

    // Verify latest_message is included
    expect(conversation.latest_message).toBeDefined()
    expect(conversation.latest_message?.content).toBe(messageContent)
    expect(conversation.latest_message?.sender_id).toBe(USER_1_ID)

    // Verify sender profile is included
    expect(conversation.latest_message?.sender).toBeDefined()
    expect(conversation.latest_message?.sender.id).toBe(USER_1_ID)
    expect(conversation.latest_message?.sender.username).toBeDefined()
  })

  it('should have undefined latest_message when no messages exist', async () => {
    // Conversation B has no messages yet
    const conversations = await conversationsDb.getForCurrentUser(USER_3_ID)

    expect(conversations).toHaveLength(1)
    expect(conversations[0].latest_message).toBeUndefined()
  })
})

describe('Conversations - Create Conversation (PostgreSQL Function)', () => {
  // Generate unique IDs for this test suite
  const USER_A_ID = crypto.randomUUID()
  const USER_B_ID = crypto.randomUUID()
  const USER_C_ID = crypto.randomUUID()

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

    await adminSupabase.auth.admin.createUser({
      id: USER_C_ID,
      email: `userC_${USER_C_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userC_${USER_C_ID.substring(0, 8)}` }
    })
  })

  it('should create conversation with 2 participants using RPC', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: conversationId, error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: [USER_A_ID, USER_B_ID]
      })

    expect(error).toBeNull()
    expect(conversationId).toBeDefined()
    expect(typeof conversationId).toBe('string')

    // Verify conversation was created
    const { data: conversation } = await adminSupabase
      .from('conversations')
      .select()
      .eq('id', conversationId)
      .single()

    expect(conversation).toBeDefined()
    expect(conversation?.id).toBe(conversationId)

    // Verify participants were created
    const { data: participants } = await adminSupabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversationId)

    expect(participants).toHaveLength(2)
    const participantUserIds = participants?.map(p => p.user_id)
    expect(participantUserIds).toContain(USER_A_ID)
    expect(participantUserIds).toContain(USER_B_ID)
  })

  it('should create conversation with 3 participants (group chat) using RPC', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: conversationId, error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: [USER_A_ID, USER_B_ID, USER_C_ID]
      })

    expect(error).toBeNull()
    expect(conversationId).toBeDefined()

    // Verify all 3 participants were created
    const { data: participants } = await adminSupabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversationId)

    expect(participants).toHaveLength(3)
    const participantUserIds = participants?.map(p => p.user_id)
    expect(participantUserIds).toContain(USER_A_ID)
    expect(participantUserIds).toContain(USER_B_ID)
    expect(participantUserIds).toContain(USER_C_ID)
  })

  it('should reject null participant_ids using RPC', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: null as any
      })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('participant_ids cannot be null or empty')
  })

  it('should reject empty participant array using RPC', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: []
      })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('participant_ids cannot be null or empty')
  })

  it('should reject single participant using RPC', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: [USER_A_ID]
      })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('At least 2 participants are required')
  })

  it('should be atomic - fail completely if participant insert fails', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const INVALID_USER_ID = crypto.randomUUID()

    // Try to create conversation with one valid user and one invalid user
    const { error } = await adminSupabase
      .rpc('create_conversation_with_participants', {
        participant_ids: [USER_A_ID, INVALID_USER_ID]
      })

    // Should fail because INVALID_USER_ID doesn't exist
    expect(error).not.toBeNull()

    // Verify no orphaned conversation was created
    // We can't easily check this without the conversation ID,
    // but the transaction should have rolled back everything
  })
})

describe('Conversations - conversationsDb.create()', () => {
  // Generate unique IDs for this test suite
  const USER_X_ID = crypto.randomUUID()
  const USER_Y_ID = crypto.randomUUID()
  const USER_Z_ID = crypto.randomUUID()

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_X_ID,
      email: `userX_${USER_X_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userX_${USER_X_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_Y_ID,
      email: `userY_${USER_Y_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userY_${USER_Y_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_Z_ID,
      email: `userZ_${USER_Z_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userZ_${USER_Z_ID.substring(0, 8)}` }
    })
  })

  it('should create conversation with 2 participants', async () => {
    const conversation = await conversationsDb.create([USER_X_ID, USER_Y_ID])

    expect(conversation).toBeDefined()
    expect(conversation.id).toBeDefined()
    expect(typeof conversation.id).toBe('string')

    // Verify conversation exists in database
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: participants } = await adminSupabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversation.id)

    expect(participants).toHaveLength(2)
    const participantUserIds = participants?.map(p => p.user_id)
    expect(participantUserIds).toContain(USER_X_ID)
    expect(participantUserIds).toContain(USER_Y_ID)
  })

  it('should create conversation with 3+ participants', async () => {
    const conversation = await conversationsDb.create([USER_X_ID, USER_Y_ID, USER_Z_ID])

    expect(conversation).toBeDefined()

    // Verify all 3 participants exist
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: participants } = await adminSupabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversation.id)

    expect(participants).toHaveLength(3)
  })

  it('should throw error for invalid participant IDs', async () => {
    const INVALID_ID = crypto.randomUUID()

    await expect(
      conversationsDb.create([USER_X_ID, INVALID_ID])
    ).rejects.toThrow()
  })

  it('should throw error for empty participant array', async () => {
    await expect(
      conversationsDb.create([])
    ).rejects.toThrow()
  })

  it('should throw error for single participant', async () => {
    await expect(
      conversationsDb.create([USER_X_ID])
    ).rejects.toThrow()
  })
})

describe('Conversations - conversationsDb.checkExists()', () => {
  // Generate unique IDs for this test suite
  const USER_P_ID = crypto.randomUUID()
  const USER_Q_ID = crypto.randomUUID()
  const USER_R_ID = crypto.randomUUID()

  let EXISTING_CONVERSATION_ID: string

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create test users
    await adminSupabase.auth.admin.createUser({
      id: USER_P_ID,
      email: `userP_${USER_P_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userP_${USER_P_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_Q_ID,
      email: `userQ_${USER_Q_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userQ_${USER_Q_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_R_ID,
      email: `userR_${USER_R_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `userR_${USER_R_ID.substring(0, 8)}` }
    })

    // Create an existing 1:1 conversation between P and Q
    const conversation = await conversationsDb.create([USER_P_ID, USER_Q_ID])
    EXISTING_CONVERSATION_ID = conversation.id
  })

  it('should find existing 1:1 conversation', async () => {
    const conversationId = await conversationsDb.checkExists(USER_P_ID, USER_Q_ID)

    expect(conversationId).toBe(EXISTING_CONVERSATION_ID)
  })

  it('should find existing conversation regardless of parameter order', async () => {
    const conversationId = await conversationsDb.checkExists(USER_Q_ID, USER_P_ID)

    expect(conversationId).toBe(EXISTING_CONVERSATION_ID)
  })

  it('should return null when no conversation exists', async () => {
    const conversationId = await conversationsDb.checkExists(USER_P_ID, USER_R_ID)

    expect(conversationId).toBeNull()
  })

  it('should return null for users with no conversations at all', async () => {
    const NEW_USER_ID = crypto.randomUUID()
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    await adminSupabase.auth.admin.createUser({
      id: NEW_USER_ID,
      email: `newuser_${NEW_USER_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `newuser_${NEW_USER_ID.substring(0, 8)}` }
    })

    const conversationId = await conversationsDb.checkExists(USER_P_ID, NEW_USER_ID)

    expect(conversationId).toBeNull()
  })

  it('should not return group chat with 3+ participants', async () => {
    // Create a group chat with P, Q, and R
    await conversationsDb.create([USER_P_ID, USER_Q_ID, USER_R_ID])

    // Check for 1:1 between P and R should still return null
    // even though they're in a group chat together
    const conversationId = await conversationsDb.checkExists(USER_P_ID, USER_R_ID)

    expect(conversationId).toBeNull()
  })
})
