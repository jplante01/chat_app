# Auth Context Best Practices

This document synthesizes best practices from official Supabase documentation for implementing authentication context in React applications with profile tables.

## Official Documentation References

- [Use Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react) - React quickstart guide
- [Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data) - Profile table patterns and triggers
- [onAuthStateChange API Reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) - Event types and warnings
- [User Sessions Guide](https://supabase.com/docs/guides/auth/sessions) - Session management details
- [Build a User Management App with React](https://supabase.com/docs/guides/getting-started/tutorials/with-react) - Complete tutorial

## Profile Table Pattern

### Recommended Database Schema

Create a `public.profiles` table with a foreign key reference to `auth.users`:

```sql
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

alter table public.profiles enable row level security;

-- RLS policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
```

### Automatic Profile Population with Triggers

**CRITICAL WARNING**: Test trigger code thoroughly. If the trigger fails, signups will be blocked.

```sql
-- Trigger function to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

-- Trigger that fires after user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Best Practice**: Only reference primary keys (like `auth.users.id`) as foreign keys. Primary keys are guaranteed stable; other database objects managed by Supabase may change.

## Auth State Events

The `onAuthStateChange` callback receives these event types:

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `INITIAL_SESSION` | Initial session load | After Supabase client retrieves stored session on page load |
| `SIGNED_IN` | User signed in | Sign-in, session confirmation, tab refocus with active session |
| `SIGNED_OUT` | User signed out | Manual signout, session expiry, single-session enforcement |
| `TOKEN_REFRESHED` | Access token refreshed | Automatic token refresh (default: 55min before expiry) |
| `USER_UPDATED` | User metadata updated | After successful `updateUser()` call |
| `PASSWORD_RECOVERY` | Password reset initiated | User lands on page with password recovery link (instead of `SIGNED_IN`) |

**Important**: `SIGNED_IN` can fire **very frequently** with multiple tabs open. Keep callbacks efficient and lightweight.

## Critical Warnings About onAuthStateChange

### 🚨 DO NOT Use Async Functions Directly

From the official docs:

> "A callback can be an async function and it runs synchronously" during event processing.

**Problems this causes**:
- Potential deadlocks
- Blocking the auth state change pipeline
- Race conditions with other Supabase operations

### ❌ Bad - Async callback with Supabase calls

```typescript
// DON'T DO THIS
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user?.id) {
    // This can cause deadlocks!
    const profile = await profilesDb.getById(session.user.id);
    setProfile(profile);
  }
});
```

### ✅ Good - Defer async operations

```typescript
// DO THIS - Use setTimeout to defer
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);

  if (session?.user?.id) {
    // Defer async work to avoid blocking
    setTimeout(async () => {
      const profile = await profilesDb.getById(session.user.id);
      setProfile(profile);
    }, 0);
  } else {
    setProfile(null);
  }
});
```

### Alternative: State Updates Only

```typescript
// Even better - just update state, let effects handle async work
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  // Let a separate useEffect fetch profile based on session change
});
```

## Recommended Auth Context Implementation

### Context Setup

```typescript
// src/providers/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';
import { supabase } from '@/utils/supabase';
import { profilesDb } from '@/db';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile when session changes
  useEffect(() => {
    if (session?.user?.id) {
      profilesDb.getById(session.user.id)
        .then(setProfile)
        .catch((error) => {
          console.error('Failed to fetch profile:', error);
          setProfile(null);
        });
    } else {
      setProfile(null);
    }
  }, [session?.user?.id]);

  // Initialize session and listen to auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        setSession(session);

        // Optional: Handle specific events
        if (event === 'SIGNED_OUT') {
          // Clear any app-specific state
          setProfile(null);
        }
      }
    );

    // CRITICAL: Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // State will be cleared by onAuthStateChange listener
  };

  return (
    <AuthContext.Provider value={{ session, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Usage in App Root

```typescript
// src/App.tsx
import { AuthProvider } from '@/providers/AuthProvider';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Protected Route Implementation

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### Usage in Components

```typescript
// src/pages/ChatPage.tsx
import { useAuth } from '@/providers/AuthProvider';

export function ChatPage() {
  const { profile, signOut } = useAuth();

  // profile is guaranteed to exist here because of ProtectedRoute
  return (
    <div>
      <h1>Welcome, {profile!.username}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Session Management Best Practices

### 1. Always Cleanup Subscriptions

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(...);

  return () => {
    subscription.unsubscribe(); // CRITICAL
  };
}, []);
```

### 2. Use getSession() Only on Mount

Don't call `getSession()` repeatedly. Store the session in state and rely on `onAuthStateChange` for updates.

```typescript
// ❌ Bad - repeated getSession calls
function MyComponent() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data }) => setSession(data.session));
    }, 1000);
  }, []);
}

// ✅ Good - single getSession + listener
function MyComponent() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);
}
```

### 3. Handle Loading States

Always show loading state while checking initial session:

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setIsLoading(false); // Only set to false after initial check
  });
}, []);
```

### 4. Token Refresh is Automatic

Supabase automatically refreshes tokens ~55 minutes before expiry. Don't manually refresh unless you have a specific need.

### 5. Multi-Tab Considerations

`onAuthStateChange` emits events across all open tabs to keep UI in sync. Events like `SIGNED_IN` and `TOKEN_REFRESHED` may fire frequently with multiple tabs open.

## Common Patterns

### Pattern 1: Separate Loading States

```typescript
interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isSessionLoading: boolean;  // Session check in progress
  isProfileLoading: boolean;  // Profile fetch in progress
  signOut: () => Promise<void>;
}
```

### Pattern 2: Error Handling

```typescript
interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  error: Error | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// In the provider
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  if (session?.user?.id) {
    profilesDb.getById(session.user.id)
      .then(profile => {
        setProfile(profile);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
        setProfile(null);
        setError(err);
      });
  }
}, [session?.user?.id]);
```

### Pattern 3: Optimistic Updates

```typescript
const updateProfile = async (updates: Partial<Profile>) => {
  if (!profile) return;

  // Optimistic update
  setProfile({ ...profile, ...updates });

  try {
    await profilesDb.update(profile.id, updates);
  } catch (error) {
    // Revert on error
    setProfile(profile);
    throw error;
  }
};
```

## Summary Checklist

- ✅ Use foreign key `references auth.users on delete cascade` for profiles table
- ✅ Only reference primary keys from `auth.users`
- ✅ Test trigger functions thoroughly (they can block signups if broken)
- ✅ Enable Row Level Security on profiles table
- ✅ Call `getSession()` once on mount, then rely on `onAuthStateChange`
- ✅ Always cleanup subscriptions with `subscription.unsubscribe()`
- ✅ Avoid async functions in `onAuthStateChange` callbacks
- ✅ Defer Supabase calls using `setTimeout(..., 0)` or separate effects
- ✅ Handle all loading states (session + profile)
- ✅ Keep `onAuthStateChange` callbacks lightweight (fires frequently)
- ✅ Combine session and profile in a single AuthContext for convenience

## Additional Resources

- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers) - Framework-specific helpers
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security) - Securing profile data
- [Server-Side Auth](https://supabase.com/docs/guides/auth/server-side) - SSR considerations
