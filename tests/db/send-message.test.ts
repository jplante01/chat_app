import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'
import { messagesDb } from '../../src/db'

describe('Messages - Create/Send', () => {
  // Generate unique IDs for this test suite
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()

  let CONVERSATION_ID: string

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create 2 test users
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `senduser1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `senduser1_${USER_1_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `senduser2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `senduser2_${USER_2_ID.substring(0, 8)}` }
    })

    // Create conversation
    const { data: conv } = await adminSupabase
      .from('conversations')
      .insert({})
      .select()
      .single()
    CONVERSATION_ID = conv.id

    // Add both users as participants
    await adminSupabase.from('conversation_participants').insert([
      { conversation_id: CONVERSATION_ID, user_id: USER_1_ID },
      { conversation_id: CONVERSATION_ID, user_id: USER_2_ID },
    ])
  })

  it('should create a new message successfully', async () => {
    const newMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Hello, this is a test message!'
    })

    expect(newMessage).toBeDefined()
    expect(newMessage.id).toBeDefined()
    expect(newMessage.content).toBe('Hello, this is a test message!')
  })

  it('should set correct message data', async () => {
    const newMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_2_ID,
      content: 'Testing message data'
    })

    expect(newMessage.conversation_id).toBe(CONVERSATION_ID)
    expect(newMessage.sender_id).toBe(USER_2_ID)
    expect(newMessage.content).toBe('Testing message data')
  })

  it('should set timestamps automatically', async () => {
    const newMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Testing timestamps'
    })

    expect(newMessage.created_at).toBeDefined()
    expect(newMessage.updated_at).toBeDefined()

    // Verify timestamp is recent (within last 5 seconds)
    const createdAt = new Date(newMessage.created_at)
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    expect(diffMs).toBeLessThan(5000) // Less than 5 seconds ago
  })

  it('should set default values correctly', async () => {
    const newMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Testing defaults'
    })

    expect(newMessage.edited).toBe(false)
    expect(newMessage.deleted_at).toBeNull()
    expect(newMessage.reply_to_id).toBeNull()
  })

  it('should include sender profile in response', async () => {
    const newMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Testing sender profile'
    })

    expect(newMessage.sender).toBeDefined()
    expect(newMessage.sender.id).toBe(USER_1_ID)
    expect(newMessage.sender.username).toBeDefined()
    expect(newMessage.sender.username).toContain('senduser1')
  })

  it('should trigger conversation.updated_at to update', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get initial conversation timestamp
    const { data: convBefore } = await adminSupabase
      .from('conversations')
      .select('updated_at')
      .eq('id', CONVERSATION_ID)
      .single()

    const initialTimestamp = convBefore.updated_at

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100))

    // Send a message
    await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'This should update conversation timestamp'
    })

    // Get updated conversation timestamp
    const { data: convAfter } = await adminSupabase
      .from('conversations')
      .select('updated_at')
      .eq('id', CONVERSATION_ID)
      .single()

    const updatedTimestamp = convAfter.updated_at

    // Verify timestamp was updated
    expect(updatedTimestamp).not.toBe(initialTimestamp)
    expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(
      new Date(initialTimestamp).getTime()
    )
  })

  it('should allow optional reply_to_id for threading', async () => {
    // Create parent message
    const parentMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_1_ID,
      content: 'Parent message'
    })

    // Create reply
    const replyMessage = await messagesDb.create({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_2_ID,
      content: 'Reply to parent',
      reply_to_id: parentMessage.id
    })

    expect(replyMessage.reply_to_id).toBe(parentMessage.id)
  })
})
