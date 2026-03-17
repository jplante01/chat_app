import supabase from '../../utils/supabase';

export function getAvatarUrl(path: string | null | undefined, updatedAt?: string | null): string | undefined {
  if (!path) return undefined;
  const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(path).data;
  return updatedAt ? `${publicUrl}?t=${new Date(updatedAt).getTime()}` : publicUrl;
}
