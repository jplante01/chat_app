# Avatar Upload Feature Plan

## Overview

Allow users to upload a profile picture from their computer. The image is optimized client-side before being stored in Supabase Storage, and the resulting public URL is saved to `profiles.avatar_url`.

---

## Current State

- `profiles.avatar_url` column already exists and is already consumed by `UserProfile`, `MessageBubble`, `UserSearch`, and `Conversation` components — all fall back to the username initial when null
- Supabase Storage is enabled globally but no bucket exists yet
- `profilesDb` has no upload method
- `AuthContext` holds `profile` state and is the source of truth for the current user's profile across the app

---

## Out of Scope

- Crop/zoom UI (can be added later)
- Server-side image transformation (Supabase Pro feature)
- Deleting old avatars on account deletion

---

## Implementation Steps

### Step 1 — Supabase Storage Bucket (Migration)

Create `supabase/migrations/<timestamp>_avatar_storage.sql`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);

-- Authenticated users can replace their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND name = auth.uid()::text);

-- Anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

Apply locally: `npx supabase db reset`

> Note: No type regeneration needed — storage operations use the Supabase JS client directly, not generated types.

---

### Step 2 — Client-Side Image Optimization Utility

Create `src/utils/optimizeImage.ts`:

```ts
export async function optimizeImage(file: File, maxSize = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}
```

**Decisions:**
- `OffscreenCanvas` — runs off the main thread, no UI jank during processing
- 256×256 max — sufficient for chat avatars, proportional scale-down
- WebP at 0.85 quality — typically 60–80% smaller than source JPEG/PNG

---

### Step 3 — Add `updateAvatar` to `profilesDb`

Add to `src/db/profiles.ts`:

```ts
import { optimizeImage } from '../utils/optimizeImage';

// inside profilesDb:

/**
 * Optimize, upload, and link a new avatar image for a user
 * Used for: Avatar upload in UserProfile settings
 * Filename is always `<userId>.webp` — overwrites the previous avatar in-place
 */
updateAvatar: async (userId: string, file: File): Promise<string> => {
  const optimized = await optimizeImage(file);
  const path = `${userId}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, optimized, { upsert: true, contentType: 'image/webp' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return publicUrl;
},
```

---

### Step 4 — Expose `updateProfile` in `AuthContext`

`AuthContext` owns `profile` state. After a successful upload the new `avatar_url` must be reflected everywhere without a page reload.

Add to `AuthContext`:

```ts
// In AuthContextType interface:
updateProfile: (updates: Partial<Profile>) => void;

// In AuthProvider:
const updateProfile = (updates: Partial<Profile>) => {
  setProfile(prev => prev ? { ...prev, ...updates } : prev);
};

// Include in value object:
const value = { ..., updateProfile };
```

---

### Step 5 — Upload UI in `UserProfile.tsx`

The avatar in `UserProfile` is already rendered. Wrap it to make it clickable and wire up the file input:

```tsx
const { user, updateProfile } = useAuth();
const [uploading, setUploading] = useState(false);
const inputRef = useRef<HTMLInputElement>(null);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;
  setUploading(true);
  try {
    const publicUrl = await profilesDb.updateAvatar(user.id, file);
    updateProfile({ avatar_url: publicUrl });
  } catch (err) {
    // surface via NotificationContext
  } finally {
    setUploading(false);
    e.target.value = ''; // reset so same file can be re-selected
  }
};
```

**UI considerations:**
- Show a loading spinner overlay on the `Avatar` while `uploading` is true
- On hover, show a camera icon overlay to hint the avatar is clickable
- The hidden `<input type="file" accept="image/*">` is triggered by clicking the avatar

---

## File Checklist

| File | Action |
|------|--------|
| `supabase/migrations/<timestamp>_avatar_storage.sql` | Create |
| `src/utils/optimizeImage.ts` | Create |
| `src/db/profiles.ts` | Add `updateAvatar` |
| `src/contexts/AuthContext.tsx` | Add `updateProfile` |
| `src/components/UserProfile.tsx` | Add upload UI |

---

## Testing

Manual testing with local Supabase:
1. `npx supabase db reset` to apply migration
2. Sign in as alice@test.com / password123
3. Click avatar → select an image file
4. Verify spinner shows during upload
5. Verify avatar updates immediately after upload
6. Verify avatar persists after page reload
7. Verify avatar appears in `MessageBubble` and `Conversation` list

Unit test (optional): `optimizeImage` can be tested by passing a `File` and asserting the returned `Blob` is `image/webp` and smaller than a known input.
