# Profile Search Visibility Feature

## Overview

This document outlines how to add a user setting that allows profiles to be hidden from search results. When enabled, a user's profile will not appear when other users search for usernames to start new conversations.

## Implementation Steps

### 1. Database Schema Changes

**Migration: Add `visible_in_search` column**

```sql
-- Add visibility column to profiles table
ALTER TABLE profiles
ADD COLUMN visible_in_search BOOLEAN NOT NULL DEFAULT true;

-- Add index for search performance
CREATE INDEX idx_profiles_visible_in_search
ON profiles(visible_in_search)
WHERE visible_in_search = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.visible_in_search IS
  'Controls whether this profile appears in user search results. Default true.';
```

**Why `visible_in_search` instead of `hidden`:**
- Positive naming is clearer ("visible" vs "hidden")
- Default `true` means existing users remain searchable (backwards compatible)
- More intuitive for future features (e.g., "if visible_in_search then show")

### 2. Row Level Security (RLS) Policy Update

**Current Policy (20251223143839_enable_rls.sql):**
```sql
-- Allow all authenticated users to view all profiles (needed for user search)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
```

**Updated Policy:**
```sql
-- Drop existing policy
DROP POLICY "Users can view all profiles" ON profiles;

-- Recreate with visibility check
CREATE POLICY "Users can view searchable profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always see their own profile
    id = auth.uid()
    -- Other users can only see profiles marked as visible
    OR visible_in_search = true
  );

-- Update comment
COMMENT ON POLICY "Users can view searchable profiles" ON profiles IS
  'Users can view their own profile and profiles marked as visible in search';
```

**Why this approach:**
- RLS automatically filters search results at the database level
- No need to modify `profilesDb.search()` function
- Prevents data leakage through direct queries
- User can always see their own profile (important for settings UI)

### 3. Application Code Changes

**No changes required for search functionality** - RLS handles filtering automatically.

**Optional enhancement to `profilesDb.search()`:**

```typescript
// src/db/profiles.ts
export const profilesDb = {
  search: async (query: string, excludeUserId?: string): Promise<Profile[]> => {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .eq('visible_in_search', true)  // Optional: explicit filter (RLS already handles this)
      .order('username', { ascending: true })
      .limit(20);

    if (excludeUserId) {
      queryBuilder = queryBuilder.neq('id', excludeUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  },
};
```

**Note:** The explicit `.eq('visible_in_search', true)` is redundant because RLS policy already filters, but it makes the intent clearer in code.

### 4. Type Updates

**After migration, regenerate types:**
```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Updated Profile type will automatically include:**
```typescript
export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  status: 'online' | 'offline' | 'away';
  last_seen_at: string;
  created_at: string;
  visible_in_search: boolean;  // New field
}
```

**No code refactoring needed** - existing code only accesses specific properties and won't break.

### 5. UI Components

#### A. Settings Toggle Component

Create a new settings component to let users toggle visibility:

```typescript
// src/components/SearchVisibilityToggle.tsx
import { useState } from 'react';
import { Switch, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../utils/supabase';

export default function SearchVisibilityToggle() {
  const { profile, refreshProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (!profile) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ visible_in_search: !profile.visible_in_search })
        .eq('id', profile.id);

      if (error) throw error;

      // Refresh profile to get updated value
      await refreshProfile();
    } catch (err) {
      console.error('Failed to update search visibility:', err);
      // TODO: Show error toast/snackbar
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            checked={profile?.visible_in_search ?? true}
            onChange={handleToggle}
            disabled={isUpdating}
          />
        }
        label={
          <>
            <Typography variant="body1">Visible in search</Typography>
            <Typography variant="caption" color="text.secondary">
              Allow other users to find you when searching for conversations
            </Typography>
          </>
        }
      />
    </FormGroup>
  );
}
```

#### B. Settings Page/Dialog

Add this component to a settings page or user profile dialog:

```typescript
// src/components/SettingsDialog.tsx
import { Dialog, DialogTitle, DialogContent, Divider } from '@mui/material';
import SearchVisibilityToggle from './SearchVisibilityToggle';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <SearchVisibilityToggle />
        {/* Add other settings here */}
      </DialogContent>
    </Dialog>
  );
}
```

#### C. Add Settings Button to UserProfile

```typescript
// src/components/UserProfile.tsx
// Add settings icon button next to status indicator
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from '@mui/material/IconButton';

// ... in render:
<IconButton onClick={() => setSettingsOpen(true)}>
  <SettingsIcon />
</IconButton>
```

### 6. Testing

#### Database Layer Tests

```typescript
// tests/db/search-visibility.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { profilesDb } from '../../src/db';
import crypto from 'crypto';

describe('Profile Search Visibility', () => {
  const HIDDEN_USER_ID = crypto.randomUUID();
  const VISIBLE_USER_ID = crypto.randomUUID();
  const SEARCHER_USER_ID = crypto.randomUUID();

  beforeAll(async () => {
    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create hidden user
    await adminClient.auth.admin.createUser({
      id: HIDDEN_USER_ID,
      email: 'hidden@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'hiddenuser' }
    });

    await adminClient
      .from('profiles')
      .update({ visible_in_search: false })
      .eq('id', HIDDEN_USER_ID);

    // Create visible user
    await adminClient.auth.admin.createUser({
      id: VISIBLE_USER_ID,
      email: 'visible@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'visibleuser' }
    });

    // Create searcher user
    await adminClient.auth.admin.createUser({
      id: SEARCHER_USER_ID,
      email: 'searcher@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'searcher' }
    });
  });

  it('should not return hidden profiles in search', async () => {
    const results = await profilesDb.search('user', SEARCHER_USER_ID);

    const hiddenUserInResults = results.some(p => p.id === HIDDEN_USER_ID);
    const visibleUserInResults = results.some(p => p.id === VISIBLE_USER_ID);

    expect(hiddenUserInResults).toBe(false);
    expect(visibleUserInResults).toBe(true);
  });

  it('should allow users to see their own hidden profile', async () => {
    const profile = await profilesDb.getById(HIDDEN_USER_ID);

    expect(profile).toBeDefined();
    expect(profile?.visible_in_search).toBe(false);
  });
});
```

#### Manual Testing Checklist

- [ ] Create new user account
- [ ] Verify default `visible_in_search` is `true`
- [ ] Search for user from another account - should appear
- [ ] Toggle visibility to `false` in settings
- [ ] Search from another account - should NOT appear
- [ ] Verify user can still see their own profile
- [ ] Verify existing conversations still work
- [ ] Toggle back to `true` - should reappear in search

### 7. Migration Timeline

**Local Development:**
```bash
# Apply migration locally
npx supabase migration new add_profile_visibility_setting
# (paste migration SQL)
npx supabase db reset

# Regenerate types
npx supabase gen types typescript --local > src/types/supabase.ts

# Test thoroughly
npm test
```

**Production Deployment:**
```bash
# Link to production
npx supabase link --project-ref <your-project-ref>

# Push migration
npx supabase db push

# Regenerate production types
npx supabase gen types typescript --project-ref <your-project-ref> > src/types/supabase.ts

# Deploy frontend with new types
npm run build
```

## Security Considerations

1. **RLS is critical** - Never rely solely on application-level filtering. The RLS policy prevents direct queries from bypassing visibility settings.

2. **User can always see themselves** - The `id = auth.uid()` clause ensures users can view/edit their own settings.

3. **Existing conversations preserved** - Hiding from search doesn't remove you from existing conversations (conversation_participants RLS is separate).

4. **Default visibility is public** - New users default to `visible_in_search = true` for backwards compatibility.

## Alternative Approaches Considered

### Approach 1: Application-level filtering only
**Rejected** - Not secure. Direct Supabase queries could bypass application code.

### Approach 2: Separate "searchable_profiles" view
**Rejected** - Adds complexity. RLS on base table is simpler and equally effective.

### Approach 3: Multiple visibility levels (public/friends/private)
**Deferred** - Can add later by changing column to enum type. Start simple with boolean.

## Future Enhancements

1. **Block list** - Allow users to hide specific profiles from their search
2. **Visibility levels** - Public, friends-only, private
3. **Temporary visibility** - Hide for X hours/days
4. **Analytics** - Track how often profile appears in searches (privacy-respecting)
5. **Discoverability settings** - Separate controls for search vs. suggestions

## References

- Current schema: `supabase/migrations/20251126220948_initial_schema.sql`
- Current RLS: `supabase/migrations/20251223143839_enable_rls.sql`
- Search function: `src/db/profiles.ts:22-42`
- Profile type: `src/types/database.types.ts:5`
