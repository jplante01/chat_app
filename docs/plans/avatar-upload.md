# Avatar Upload Feature — Implementation Plan

## Overview

Users can upload a profile picture from `UserProfile`. The image is optimized client-side, uploaded to Supabase Storage, and the profile is updated automatically via a database trigger. Profile state in the app is managed by React Query and kept fresh via cache invalidation on writes.

---

## Architecture

### Atomic upload via DB trigger

The frontend only uploads the file to storage. A Postgres trigger on `storage.objects` automatically updates `profiles.avatar_url` whenever a file lands in the `avatars` bucket — no second network call from the client.

`profiles.avatar_url` stores the **storage path** (e.g. `<uuid>.webp`), not a full URL. This keeps the trigger environment-agnostic. The app constructs the full URL with a `getAvatarUrl()` helper that calls `supabase.storage.from('avatars').getPublicUrl(path)`.

### React Query for profile state

The current user's profile is fetched and cached via React Query. After any write operation (e.g. avatar upload), the caller invalidates the profile query key — React Query refetches automatically. No realtime subscription needed; cache invalidation on writes is sufficient.

---

## Current State

- `profiles.avatar_url` column already exists and is consumed by `UserProfile`, `MessageBubble`, `UserSearch`, and `Conversation` — all fall back to the username initial when null
- No storage bucket exists yet
- `profilesDb` has no `updateAvatar` method
- `AuthContext` manually fetches profile on session change — no React Query yet
- `@tanstack/react-query` is already installed and `QueryProvider` exists at `src/providers/QueryProvider.tsx`

---

## Out of Scope

- Crop/zoom UI (can be added later)
- Server-side image transformation (Supabase Pro feature)
- Deleting old avatars on account deletion

---

## Implementation Steps

### 1. Storage bucket + trigger migration

`supabase/migrations/<timestamp>_avatar_storage.sql`

```sql
-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND starts_with(name, auth.uid()::text));

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND starts_with(name, auth.uid()::text));

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Trigger: update profiles.avatar_url on storage upload
CREATE OR REPLACE FUNCTION storage.update_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'avatars' THEN
    UPDATE public.profiles
    SET avatar_url = NEW.name
    WHERE id = split_part(NEW.name, '.', 1)::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_avatar_upload
AFTER INSERT OR UPDATE ON storage.objects
FOR EACH ROW EXECUTE FUNCTION storage.update_profile_avatar();
```

Apply: `npx supabase db reset`

---

### 2. `getAvatarUrl` helper

`src/utils/avatarUrl.ts`

```ts
import supabase from '../../utils/supabase';

export function getAvatarUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
```

---

### 3. Client-side image optimization

`src/utils/optimizeImage.ts`

```ts
export async function optimizeImage(file: File, maxSize = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}
```

**Decisions:**
- `OffscreenCanvas` — runs off the main thread, no UI jank during processing
- 256×256 max — sufficient for chat avatars, proportional scale-down
- WebP at 0.85 quality — typically 60–80% smaller than source JPEG/PNG

---

### 4. `profilesDb.updateAvatar` — storage upload only

`src/db/profiles.ts`

`updateAvatar` uploads the optimized file and returns the storage path. The trigger handles the `profiles` table update — no second DB call from the frontend.

```ts
import { optimizeImage } from '../utils/optimizeImage';

/**
 * Optimize and upload a new avatar to storage.
 * The DB trigger on storage.objects automatically updates profiles.avatar_url.
 * Returns the storage path (not a full URL).
 */
updateAvatar: async (userId: string, file: File): Promise<string> => {
  const optimized = await optimizeImage(file);
  const path = `${userId}.webp`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, optimized, { upsert: true, contentType: 'image/webp' });

  if (error) throw error;
  return path;
},
```

---

### 5. React Query hook for profile state

`src/hooks/useProfile.ts`

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesDb } from '../db';

export function profileQueryKey(userId: string) {
  return ['profile', userId];
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? profileQueryKey(userId) : [],
    queryFn: () => profilesDb.getById(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return (userId: string) =>
    queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
}
```

---

### 6. Update `AuthContext`

Remove the manual `supabase.from('profiles').select()` effect and source `profile` from React Query instead.

```ts
// Remove: useEffect that fetches profile from supabase directly
// Remove: updateProfile function and its AuthContextType entry
// Add: const { data: profile } = useProfile(user?.id)
// Keep: profile exposed in context value (same interface for consumers)
```

---

### 7. `UserProfile` upload UI

Add a clickable avatar with a camera hover hint, hidden file input, and loading spinner. After upload, invalidate the profile query — no manual state patching.

```tsx
const { user } = useAuth();
const invalidateProfile = useInvalidateProfile();
const inputRef = useRef<HTMLInputElement>(null);
const [uploading, setUploading] = useState(false);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;
  setUploading(true);
  try {
    await profilesDb.updateAvatar(user.id, file);
    await invalidateProfile(user.id);
  } catch (err) {
    console.error('Avatar upload failed:', err);
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};
```

Avatar display:
```tsx
<Avatar src={getAvatarUrl(profile.avatar_url)} ... />
```

UI details:
- Clicking the avatar triggers the hidden `<input type="file" accept="image/*">`
- Camera icon overlay appears on hover
- Spinner overlays the avatar while uploading

---

### 8. Update avatar display in other components

Wrap `profile.avatar_url` with `getAvatarUrl()` in:
- `src/components/MessageBubble.tsx`
- `src/components/UserSearch.tsx`
- `src/components/Conversation.tsx`

---

## File Checklist

| File | Action |
|------|--------|
| `supabase/migrations/<ts>_avatar_storage.sql` | Create |
| `src/utils/avatarUrl.ts` | Create |
| `src/utils/optimizeImage.ts` | Create |
| `src/hooks/useProfile.ts` | Create |
| `src/db/profiles.ts` | Add `updateAvatar` (storage upload only) |
| `src/contexts/AuthContext.tsx` | Remove manual fetch + `updateProfile`; use `useProfile` |
| `src/components/UserProfile.tsx` | Add upload UI; wrap avatar with `getAvatarUrl()` |
| `src/components/MessageBubble.tsx` | Wrap avatar with `getAvatarUrl()` |
| `src/components/UserSearch.tsx` | Wrap avatar with `getAvatarUrl()` |
| `src/components/Conversation.tsx` | Wrap avatar with `getAvatarUrl()` |

---

## Verification

1. `npx supabase db reset` to apply migration
2. Sign in as alice@test.com / password123
3. Click avatar → upload an image
4. Confirm avatar updates in sidebar, MessageBubble, and Conversation list
5. Check network tab — only **one** POST to storage (no second PATCH to profiles)
6. Check Supabase Studio → `profiles` table: `avatar_url` should contain just the path (e.g. `<uuid>.webp`)
7. Sign in as Alice in a second tab — upload in tab 1, refresh tab 2 manually and confirm avatar loads correctly
