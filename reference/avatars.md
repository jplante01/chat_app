# Avatar Implementation Guide

## Overview

This document outlines the technical considerations and implementation options for user avatars in the chat application.

## Implementation Options

### Option 1: Supabase Storage (Recommended for Learning)

**How it works:**
- Users upload images via a form
- Images stored in Supabase Storage buckets
- Avatar URLs stored in the `profiles.avatar_url` field
- Images served via Supabase CDN URLs

**Pros:**
- Complete feature implementation
- Learn real file upload patterns
- Supabase makes it surprisingly easy
- Good for portfolio/demo purposes

**Implementation effort:** ~2-3 hours
- Supabase bucket setup (5 mins)
- Upload component with file picker (30 mins)
- Image validation & resizing (30 mins - optional but recommended)
- Hooking it up to profile updates (1 hour)

**Libraries needed:**
```bash
npm install react-dropzone  # Nice drag-drop upload UX (optional)
```

**Basic code example:**
```typescript
// Upload to Supabase Storage
const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
```

**Supabase bucket setup:**
```sql
-- In Supabase dashboard, create bucket
CREATE BUCKET avatars WITH (public = true);

-- Set storage policies (RLS for uploads)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Option 2: Predefined Avatar Selection (Simpler)

**How it works:**
- Store 8-12 avatar images in your `public/avatars/` folder
- Users pick from a grid during signup/settings
- Store the chosen avatar filename/path in `avatar_url`

**Pros:**
- No file upload complexity
- No storage costs
- Faster implementation
- Still looks polished

**Implementation effort:** ~30 mins
- Find/create avatar set
- Build selection grid component
- Update profile on selection

**Where to get avatars:**
- Generate with [DiceBear API](https://www.dicebear.com/) (free avatars as URLs)
- Use emoji avatars
- Download free avatar pack from UI8/Freepik

### Option 3: Third-Party Avatar Services (Instant)

**Examples:**
- **Gravatar** - Email-based avatars (many users already have)
- **DiceBear** - Generate avatars from username/ID
- **UI Avatars** - Generate letter avatars from names

**How it works:**
```typescript
// DiceBear example
const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

// UI Avatars example
const avatarUrl = `https://ui-avatars.com/api/?name=${username}&background=random`;
```

**Pros:**
- Zero implementation needed
- No storage required
- Infinite unique avatars

**Cons:**
- Depends on external service
- Less user control

## Why Use URLs Instead of Downloading Images?

This is an important architectural decision. Here's why we use URLs:

### 1. Bandwidth Efficiency
- Image served once from CDN, cached by browser
- No need to re-download on every app load
- Supabase CDN handles caching globally

### 2. Storage Model
- Your app binary stays small
- Images stored separately from app code
- Users only download images they need (lazy loading)

### 3. Dynamic Content
- Users can change avatars without app update
- New users' avatars appear without code changes
- Images can be updated/deleted independently

### 4. Scalability
- CDN handles millions of requests
- Your app doesn't serve image bytes
- Browser caches reduce repeated requests

### 5. How It Actually Works
```
User opens app → Sees avatar_url in database
  → Browser fetches image from URL
  → Browser caches it locally
  → Subsequent loads: instant (from cache)
```

## Supabase Storage Buckets Explained

**What are they?**
- S3-compatible object storage
- Like AWS S3, but integrated with Supabase
- Designed for files (images, videos, PDFs, etc.)

**Why use them?**
```
Database (PostgreSQL)     → Structured data (text, numbers, dates)
Storage (Buckets)        → Files (images, videos, documents)
```

**Key Concepts:**
- **Bucket**: Container for files (like a folder at the top level)
- **Public vs Private**: Control who can access files
- **RLS Policies**: Fine-grained access control per user
- **CDN**: Automatic global distribution for fast loading

## Recommended Implementation Strategy

### Hybrid Approach for Toy Projects

1. **Start with DiceBear** (5 minutes):
   - Auto-generate avatars from usernames
   - Looks professional immediately
   - Zero setup

2. **Add predefined avatar selection** (30 mins):
   - Let users pick from 8-10 nice avatars
   - Stored in `/public/avatars/`
   - Shows you can build UI for selection

3. **Optional: Add Supabase upload later** (if you want to learn):
   - Good portfolio piece
   - "I implemented file uploads with Supabase Storage"
   - Real production pattern

### Immediate Implementation Example

```typescript
// In your profile creation/update
const getDefaultAvatar = (username: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
};

// When creating profile
const newProfile = {
  username: 'Alice',
  avatar_url: getDefaultAvatar('Alice'),
  // ... other fields
};
```

This gives you working avatars in 5 minutes, and you can always upgrade to uploads later if you want to showcase that skill.

## Database Schema

The `profiles` table already has an `avatar_url` field:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  avatar_url TEXT,  -- Stores the URL to the avatar
  status TEXT DEFAULT 'offline',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This field can hold:
- Supabase Storage URLs: `https://your-project.supabase.co/storage/v1/object/public/avatars/user-id.jpg`
- External service URLs: `https://api.dicebear.com/7.x/avataaars/svg?seed=alice`
- Relative paths: `/avatars/avatar-1.png` (for public folder assets)

## Security Considerations

### For Supabase Storage:

1. **Validate file types**:
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

2. **Limit file size**:
```typescript
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

3. **Use RLS policies** to ensure users can only upload their own avatars

4. **Consider image resizing** to prevent huge uploads:
   - Use browser-side resizing (canvas API)
   - Or Supabase Edge Functions with image processing

### For External Services:

- No security concerns (they handle everything)
- Consider privacy implications (DiceBear is open source and privacy-friendly)
- Could be blocked by corporate firewalls

## Performance Considerations

1. **Avatar sizes**: Aim for 200x200px or smaller
2. **Format**: WebP for best compression, fallback to PNG/JPG
3. **Caching**: Set proper cache headers (Supabase Storage does this automatically)
4. **Loading states**: Show skeleton/placeholder while avatar loads
5. **Fallback**: Always have a fallback (initials in a colored circle)

## Implementation Checklist

### Minimal (DiceBear):
- [ ] Create helper function to generate DiceBear URL
- [ ] Update profile creation to set avatar_url
- [ ] Test avatars display in UI

### Basic (Predefined + DiceBear):
- [ ] Add 8-10 avatar images to public/avatars/
- [ ] Create avatar selection component
- [ ] Allow users to pick avatar in settings
- [ ] Update profile with selected avatar
- [ ] Keep DiceBear as fallback

### Advanced (Supabase Storage):
- [ ] Create Supabase storage bucket
- [ ] Set up RLS policies
- [ ] Build file upload component
- [ ] Add client-side image validation
- [ ] Optional: Add image resizing
- [ ] Handle upload errors gracefully
- [ ] Update profile.avatar_url after upload
- [ ] Test with different image formats/sizes
