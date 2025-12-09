import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'
import { profilesDb } from '../../src/db'

describe('Profile Creation', () => {
  const USER_ID = crypto.randomUUID()
  const USERNAME = `testuser_${USER_ID.substring(0, 8)}`

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    // Create admin client for setup
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create test user - this should trigger profile creation via handle_new_user()
    await adminSupabase.auth.admin.createUser({
      id: USER_ID,
      email: `${USERNAME}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        username: USERNAME
      }
    })
  })

  it('should automatically create a profile when user signs up', async () => {
    // Use the profilesDb function to fetch the profile
    const profile = await profilesDb.getById(USER_ID)

    expect(profile).toBeDefined()
    expect(profile?.id).toBe(USER_ID)
    expect(profile?.username).toBe(USERNAME)
    expect(profile?.status).toBe('offline')
    expect(profile?.avatar_url).toBeNull()
    expect(profile?.created_at).toBeDefined()
    expect(profile?.last_seen_at).toBeDefined()
  })
})
