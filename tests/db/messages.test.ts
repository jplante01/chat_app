import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'
import { messagesDb } from '../../src/db'

describe('Messages - Get By Conversation', () => {
  // Generate unique IDs for this test suite
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()

  let CONVERSATION_ID: string
  let MESSAGE_1_ID: string
  let MESSAGE_2_ID: string
  let DELETED_MESSAGE_ID: string

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create 2 test users
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `msguser1_${USER_1_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `msguser1_${USER_1_ID.substring(0, 8)}` }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `msguser2_${USER_2_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: `msguser2_${USER_2_ID.substring(0, 8)}` }
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

    // Create messages (with slight delays to ensure ordering)
    const { data: msg1 } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: CONVERSATION_ID,
        sender_id: USER_1_ID,
        content: 'Hello from User 1'
      })
      .select()
      .single()
    MESSAGE_1_ID = msg1.id

    await new Promise(resolve => setTimeout(resolve, 50))

    const { data: msg2 } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: CONVERSATION_ID,
        sender_id: USER_2_ID,
        content: 'Hi from User 2'
      })
      .select()
      .single()
    MESSAGE_2_ID = msg2.id

    await new Promise(resolve => setTimeout(resolve, 50))

    // Create a soft-deleted message
    const { data: deletedMsg } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: CONVERSATION_ID,
        sender_id: USER_1_ID,
        content: 'This message will be deleted',
        deleted_at: new Date().toISOString()
      })
      .select()
      .single()
    DELETED_MESSAGE_ID = deletedMsg.id
  })

  it('should return all non-deleted messages for the conversation', async () => {
    const messages = await messagesDb.getByConversation(CONVERSATION_ID)

    expect(messages).toHaveLength(2)
    expect(messages.map(m => m.id)).toContain(MESSAGE_1_ID)
    expect(messages.map(m => m.id)).toContain(MESSAGE_2_ID)
  })

  it('should include sender profile information', async () => {
    const messages = await messagesDb.getByConversation(CONVERSATION_ID)

    messages.forEach(message => {
      expect(message.sender).toBeDefined()
      expect(message.sender.id).toBeDefined()
      expect(message.sender.username).toBeDefined()
    })

    // Verify specific sender data
    const msg1 = messages.find(m => m.id === MESSAGE_1_ID)
    expect(msg1?.sender.id).toBe(USER_1_ID)
  })

  it('should exclude soft-deleted messages', async () => {
    const messages = await messagesDb.getByConversation(CONVERSATION_ID)

    const messageIds = messages.map(m => m.id)
    expect(messageIds).not.toContain(DELETED_MESSAGE_ID)
  })

  it('should order messages chronologically (oldest first)', async () => {
    const messages = await messagesDb.getByConversation(CONVERSATION_ID)

    expect(messages).toHaveLength(2)
    expect(messages[0].id).toBe(MESSAGE_1_ID) // First message
    expect(messages[1].id).toBe(MESSAGE_2_ID) // Second message

    // Verify timestamps are ascending
    const firstTime = new Date(messages[0].created_at).getTime()
    const secondTime = new Date(messages[1].created_at).getTime()
    expect(firstTime).toBeLessThan(secondTime)
  })

  it('should return empty array for conversation with no messages', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create empty conversation
    const { data: emptyConv } = await adminSupabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    const messages = await messagesDb.getByConversation(emptyConv.id)

    expect(messages).toEqual([])
  })

  it('should only return messages from the specified conversation', async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create a second conversation with a message
    const { data: conv2 } = await adminSupabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    await adminSupabase.from('messages').insert({
      conversation_id: conv2.id,
      sender_id: USER_1_ID,
      content: 'Message in different conversation'
    })

    // Query first conversation
    const messages = await messagesDb.getByConversation(CONVERSATION_ID)

    // Should only have 2 messages from CONVERSATION_ID
    expect(messages).toHaveLength(2)
    messages.forEach(msg => {
      expect(msg.conversation_id).toBe(CONVERSATION_ID)
    })
  })
})
