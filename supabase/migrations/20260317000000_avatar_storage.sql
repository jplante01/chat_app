-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND starts_with(name, auth.uid()::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND starts_with(name, auth.uid()::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatars are publicly readable' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatars are publicly readable"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Add updated_at to profiles for cache-busting avatar URLs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger: update profiles.avatar_url and updated_at on storage upload
CREATE OR REPLACE FUNCTION storage.update_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'avatars' THEN
    UPDATE public.profiles
    SET avatar_url = NEW.name,
        updated_at = NOW()
    WHERE id = split_part(NEW.name, '.', 1)::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
CREATE TRIGGER on_avatar_upload
AFTER INSERT OR UPDATE ON storage.objects
FOR EACH ROW EXECUTE FUNCTION storage.update_profile_avatar();
