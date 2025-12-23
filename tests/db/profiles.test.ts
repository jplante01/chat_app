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

describe('Profiles - Search', () => {
  // Generate unique IDs for this test suite
  const USER_ALICE_ID = crypto.randomUUID()
  const USER_BOB_ID = crypto.randomUUID()
  const USER_CHARLIE_ID = crypto.randomUUID()
  const USER_DIANA_ID = crypto.randomUUID()
  const USER_EXCLUDE_ID = crypto.randomUUID()

  const SUPABASE_URL = 'http://127.0.0.1:54321'
  const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  beforeAll(async () => {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Create test users with specific usernames
    await adminSupabase.auth.admin.createUser({
      id: USER_ALICE_ID,
      email: `alice_${USER_ALICE_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'alice_search' }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_BOB_ID,
      email: `bob_${USER_BOB_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'bob_search' }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_CHARLIE_ID,
      email: `charlie_${USER_CHARLIE_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'charlie_other' }
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_DIANA_ID,
      email: `diana_${USER_DIANA_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'SEARCH_DIANA' } // Uppercase to test case-insensitivity
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_EXCLUDE_ID,
      email: `exclude_${USER_EXCLUDE_ID.substring(0, 8)}@test.com`,
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'exclude_search' }
    })
  })

  it('should find users by username (case-insensitive)', async () => {
    const results = await profilesDb.search('search')

    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThanOrEqual(3) // alice_search, bob_search, SEARCH_DIANA, exclude_search

    const usernames = results.map(r => r.username)
    expect(usernames).toContain('alice_search')
    expect(usernames).toContain('bob_search')
    expect(usernames).toContain('SEARCH_DIANA') // Case-insensitive search
    expect(usernames).toContain('exclude_search')
  })

  it('should find users with partial match', async () => {
    const results = await profilesDb.search('ali')

    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThanOrEqual(1)

    const usernames = results.map(r => r.username)
    expect(usernames).toContain('alice_search')
  })

  it('should exclude specified user from results', async () => {
    const results = await profilesDb.search('exclude', USER_EXCLUDE_ID)

    expect(results).toBeDefined()

    const userIds = results.map(r => r.id)

    // The excluded user should NOT appear in results
    expect(userIds).not.toContain(USER_EXCLUDE_ID)

    // Since we're searching for 'exclude' and excluding USER_EXCLUDE_ID who has 'exclude_search',
    // result should be empty or not contain USER_EXCLUDE_ID
    const excludedUser = results.find(r => r.id === USER_EXCLUDE_ID)
    expect(excludedUser).toBeUndefined()
  })

  it('should return empty array when no matches found', async () => {
    const results = await profilesDb.search('xyznonexistent123')

    expect(results).toBeDefined()
    expect(results).toEqual([])
  })

  it('should return results in alphabetical order', async () => {
    const results = await profilesDb.search('search')

    expect(results.length).toBeGreaterThan(0)

    // Verify results are sorted alphabetically by username (case-insensitive)
    const usernames = results.map(r => r.username)

    // Check that each username is <= the next one (alphabetical order)
    for (let i = 0; i < usernames.length - 1; i++) {
      const current = usernames[i].toLowerCase()
      const next = usernames[i + 1].toLowerCase()
      expect(current.localeCompare(next)).toBeLessThanOrEqual(0)
    }
  })

  it('should limit results to 20 users', async () => {
    // This test verifies the limit, but we'd need 21+ users with matching names
    // For now, just verify that the function doesn't return more than 20
    const results = await profilesDb.search('search')

    expect(results.length).toBeLessThanOrEqual(20)
  })

  it('should handle empty search string', async () => {
    const results = await profilesDb.search('')

    // Empty string should match all users (up to limit of 20)
    expect(results).toBeDefined()
    expect(results.length).toBeLessThanOrEqual(20)
  })

  it('should match users regardless of case in search query', async () => {
    const resultsLower = await profilesDb.search('diana')
    const resultsUpper = await profilesDb.search('DIANA')

    expect(resultsLower.length).toBeGreaterThan(0)
    expect(resultsUpper.length).toBeGreaterThan(0)
    expect(resultsLower.length).toBe(resultsUpper.length)

    const usernamesLower = resultsLower.map(r => r.username)
    const usernamesUpper = resultsUpper.map(r => r.username)

    expect(usernamesLower).toContain('SEARCH_DIANA')
    expect(usernamesUpper).toContain('SEARCH_DIANA')
  })
})
