import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesDb } from '../db';
import { useNotification } from './useNotification';

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

export function useUploadAvatar(userId: string) {
  const invalidateProfile = useInvalidateProfile();
  const { error: showError } = useNotification();
  return useMutation({
    mutationFn: (file: File) => profilesDb.updateAvatar(userId, file),
    onSuccess: () => invalidateProfile(userId),
    onError: () => showError('Failed to upload avatar. Please try again.'),
  });
}
