import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'

describe('Todos RLS', () => {
  // Generate unique IDs for this test suite to avoid conflicts with other tests
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!)

  beforeAll(async () => {
    // Setup test data specific to this test suite
    const adminSupabase = createClient(process.env.SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!)

    // Create test users with unique IDs
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `user1-${USER_1_ID}@test.com`,
      password: 'password123',
      // We want the user to be usable right away without email confirmation
      email_confirm: true,
    })
    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `user2-${USER_2_ID}@test.com`,
      password: 'password123',
      email_confirm: true,
    })

    // Create initial todos
    await adminSupabase.from('todos').insert([
      { task: 'User 1 Task 1', user_id: USER_1_ID },
      { task: 'User 1 Task 2', user_id: USER_1_ID },
      { task: 'User 2 Task 1', user_id: USER_2_ID },
    ])
  })

  it('should allow User 1 to only see their own todos', async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: `user1-${USER_1_ID}@test.com`,
      password: 'password123',
    })

    const { data: todos } = await supabase.from('todos').select('*')

    expect(todos).toHaveLength(2)
    todos?.forEach((todo) => {
      expect(todo.user_id).toBe(USER_1_ID)
    })
  })

  it('should allow User 1 to create their own todo', async () => {
    await supabase.auth.signInWithPassword({
      email: `user1-${USER_1_ID}@test.com`,
      password: 'password123',
    })

    const { error } = await supabase.from('todos').insert({ task: 'New Task', user_id: USER_1_ID })

    expect(error).toBeNull()
  })

  it('should allow User 2 to only see their own todos', async () => {
    // Sign in as User 2
    await supabase.auth.signInWithPassword({
      email: `user2-${USER_2_ID}@test.com`,
      password: 'password123',
    })

    const { data: todos } = await supabase.from('todos').select('*')
    expect(todos).toHaveLength(1)
    todos?.forEach((todo) => {
      expect(todo.user_id).toBe(USER_2_ID)
    })
  })

  it('should prevent User 2 from modifying User 1 todos', async () => {
    await supabase.auth.signInWithPassword({
      email: `user2-${USER_2_ID}@test.com`,
      password: 'password123',
    })

    // Attempt to update the todos we shouldn't have access to
    // result will be a no-op
    await supabase.from('todos').update({ task: 'Hacked!' }).eq('user_id', USER_1_ID)

    // Log back in as User 1 to verify their todos weren't changed
    await supabase.auth.signInWithPassword({
      email: `user1-${USER_1_ID}@test.com`,
      password: 'password123',
    })

    // Fetch User 1's todos
    const { data: todos } = await supabase.from('todos').select('*')

    // Verify that none of the todos were changed to "Hacked!"
    expect(todos).toBeDefined()
    todos?.forEach((todo) => {
      expect(todo.task).not.toBe('Hacked!')
    })
  })
})