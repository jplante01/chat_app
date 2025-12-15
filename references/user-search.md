# User Search Implementation Guide

## Overview

This document details the implementation of user search functionality to enable starting new conversations in the chat application.

## Current Implementation (Mock Data)

### Component: UserSearch

**Location:** `src/components/UserSearch.tsx`

**Purpose:** Allow users to search for other users and start new conversations.

**Features:**
- Search field with icon
- Real-time filtering as user types
- Shows results only when search query is not empty
- Displays user avatar, username, and online status
- Clears search after selecting a user

**Props:**
```typescript
interface UserSearchProps {
  currentUserId: string;       // To filter out current user from results
  onUserSelect: (user: Profile) => void;  // Callback when user is clicked
}
```

**Current behavior:**
- Uses mock user data (Alice, Bob, Charlie, Diana, Eve)
- Filters users client-side based on username
- Excludes current user from results
- Calls `onUserSelect` when a user is clicked (currently just logs)

## UI Layout

```
┌─────────────────────────┐
│ [Avatar] You ⚙️         │ ← UserProfile
├─────────────────────────┤
│ 🔍 Search users...      │ ← UserSearch (input)
├─────────────────────────┤
│ Search Results          │ ← UserSearch (results, visible when typing)
│ • Diana      Online     │
│ • Diana2     Offline    │
├─────────────────────────┤
│ Conversations           │ ← ConversationsList
│ • Alice    Hey! How...  │
│ • Bob      Sounds good  │
└─────────────────────────┘
```

## Future Implementation (Real Database)

### Step 1: Create Database Query Function

Create `src/db/profiles.ts`:

```typescript
import { supabase } from '@/utils/supabase';
import { Profile } from '@/types/database.types';

export const profilesDb = {
  /**
   * Search for users by username
   * Excludes the current user from results
   */
  async search(query: string, currentUserId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a profile by user ID
   */
  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },
};
```

### Step 2: Add Debouncing to Search

To avoid hitting the database on every keystroke:

```typescript
import { useState, useEffect } from 'react';
import { profilesDb } from '@/db';

export default function UserSearch({ currentUserId, onUserSelect }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce search - wait 300ms after user stops typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await profilesDb.search(searchQuery, currentUserId);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserId]);

  // ... rest of component
}
```

### Step 3: Create Conversation on User Select

Create `src/db/conversations.ts` with a find-or-create function:

```typescript
import { supabase } from '@/utils/supabase';
import { Conversation, ConversationWithParticipants } from '@/types/database.types';

export const conversationsDb = {
  /**
   * Find existing conversation between two users
   */
  async findBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<ConversationWithParticipants | null> {
    // Query for conversations where both users are participants
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('conversation_participants.user_id', userId1)
      .eq('conversation_participants.user_id', userId2)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  /**
   * Create a new conversation between two users
   */
  async create(participantIds: string[]): Promise<Conversation> {
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const participants = participantIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) throw partError;

    return conversation;
  },

  /**
   * Find existing conversation or create new one
   */
  async findOrCreate(
    userId1: string,
    userId2: string
  ): Promise<ConversationWithParticipants> {
    // Try to find existing
    const existing = await this.findBetweenUsers(userId1, userId2);
    if (existing) return existing;

    // Create new
    const conversation = await this.create([userId1, userId2]);

    // Fetch full conversation with participants
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', conversation.id)
      .single();

    if (error) throw error;
    return data;
  },
};
```

### Step 4: Wire Up in Drawer Component

Update `Drawer.tsx`:

```typescript
import { conversationsDb } from '@/db';

const DrawerContent = ({ selectedConversationId, onConversationSelect }: DrawerContentProps) => {
  const [loading, setLoading] = useState(false);

  const handleUserSelect = async (user: Profile) => {
    setLoading(true);
    try {
      // Find or create conversation
      const conversation = await conversationsDb.findOrCreate(
        CURRENT_USER.id,
        user.id
      );

      // Select the conversation
      onConversationSelect(conversation.id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      // TODO: Show error toast/notification
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

## Performance Considerations

### 1. Search Query Optimization

**Problem:** Searching on every keystroke hammers the database.

**Solution:** Debouncing (implemented in Step 2)

**Alternative:** Use full-text search for better performance:

```sql
-- Add full-text search index
CREATE INDEX profiles_username_search_idx
ON profiles
USING GIN (to_tsvector('english', username));

-- Query with full-text search
SELECT * FROM profiles
WHERE to_tsvector('english', username) @@ plainto_tsquery('english', $1)
AND id != $2
LIMIT 10;
```

### 2. Result Limiting

Always limit search results (currently set to 10).

**Why:** Prevents returning thousands of users, keeps UI responsive.

### 3. Caching Search Results

For frequently searched users, consider client-side caching:

```typescript
const searchCache = new Map<string, Profile[]>();

const cachedSearch = async (query: string) => {
  if (searchCache.has(query)) {
    return searchCache.get(query)!;
  }

  const results = await profilesDb.search(query, currentUserId);
  searchCache.set(query, results);
  return results;
};
```

## Edge Cases to Handle

### 1. User Already Has Conversation

**Current behavior:** Creates duplicate conversation (bug)

**Solution:** Use `findOrCreate` function (Step 3)

**Result:** Selects existing conversation instead of creating duplicate

### 2. Searching for Self

**Current behavior:** Filtered out in `UserSearch` component

**Why:** Can't message yourself (confusing UX)

### 3. Empty Search Results

**Current behavior:** Shows "No users found" message

**Alternative:** Show popular/recent users when search is empty

### 4. Slow Network

**Solution:** Show loading spinner while searching

```typescript
{loading && <CircularProgress size={20} />}
```

## Database Constraints

To prevent duplicate conversations, add a unique constraint:

```sql
-- Ensure only one conversation per user pair
-- This is complex because conversations can have multiple participants
-- For two-person chats, we can use a simpler approach

CREATE OR REPLACE FUNCTION check_duplicate_conversation()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INT;
  existing_conv_id UUID;
BEGIN
  -- Count participants in the conversation being created
  SELECT COUNT(*) INTO participant_count
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id;

  -- Only check for two-person conversations
  IF participant_count = 2 THEN
    -- Find existing conversation with same two participants
    SELECT cp1.conversation_id INTO existing_conv_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = NEW.user_id
      AND cp2.user_id != NEW.user_id
      AND cp1.conversation_id != NEW.conversation_id
    LIMIT 1;

    IF existing_conv_id IS NOT NULL THEN
      RAISE EXCEPTION 'Conversation already exists between these users';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_conversations
  BEFORE INSERT ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_conversation();
```

**Note:** This is complex. The simpler approach is to check in application code (Step 3).

## UX Improvements

### 1. Recent Conversations at Top

When search is empty, show recently messaged users:

```typescript
const [recentUsers, setRecentUsers] = useState<Profile[]>([]);

useEffect(() => {
  if (!searchQuery) {
    // Load recent users from conversations
    loadRecentUsers();
  }
}, [searchQuery]);
```

### 2. Keyboard Navigation

Allow users to navigate results with arrow keys and Enter:

```typescript
const [selectedIndex, setSelectedIndex] = useState(0);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
  } else if (e.key === 'ArrowUp') {
    setSelectedIndex(prev => Math.max(prev - 1, 0));
  } else if (e.key === 'Enter' && results[selectedIndex]) {
    handleUserClick(results[selectedIndex]);
  }
};
```

### 3. User Status Indicators

Show online/offline status with colored dots (already implemented in mock).

### 4. Search History

Store recent searches locally:

```typescript
const [searchHistory, setSearchHistory] = useState<string[]>([]);

useEffect(() => {
  const history = localStorage.getItem('searchHistory');
  if (history) setSearchHistory(JSON.parse(history));
}, []);

const addToHistory = (query: string) => {
  const updated = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
  setSearchHistory(updated);
  localStorage.setItem('searchHistory', JSON.stringify(updated));
};
```

## Testing Checklist

When implementing real database integration:

- [ ] Search returns correct results
- [ ] Current user is excluded from results
- [ ] Clicking user creates conversation (if new)
- [ ] Clicking user selects conversation (if exists)
- [ ] Duplicate conversations are prevented
- [ ] Search is debounced (doesn't query on every keystroke)
- [ ] Empty search shows appropriate state
- [ ] Loading states are shown
- [ ] Errors are handled gracefully
- [ ] Works with slow network
- [ ] Search clears after selecting user
- [ ] Keyboard navigation works (optional)

## Implementation Checklist

- [x] Create UserSearch component with mock data
- [x] Add to Drawer layout
- [x] Test search filtering
- [x] Test user selection callback
- [ ] Create `profilesDb.search()` function
- [ ] Add debouncing to search
- [ ] Create `conversationsDb.findOrCreate()` function
- [ ] Wire up real conversation creation
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with real database
- [ ] Add database constraints (optional)
- [ ] Add keyboard navigation (optional)
- [ ] Add search history (optional)

## Files Modified

1. **Created:** `src/components/UserSearch.tsx` - Search component with mock data
2. **Modified:** `src/components/Drawer.tsx` - Added UserSearch to layout
3. **To Create:** `src/db/profiles.ts` - Database queries for user search
4. **To Create:** `src/db/conversations.ts` - Conversation creation logic

## Next Steps

1. **For now:** The mock implementation is working and demonstrates the UX
2. **Later:** When ready to connect to database:
   - Follow Step 1-4 above
   - Create the database functions
   - Wire up the real data
   - Test thoroughly

The current implementation provides a fully functional UI that can be tested and refined before adding database complexity.
