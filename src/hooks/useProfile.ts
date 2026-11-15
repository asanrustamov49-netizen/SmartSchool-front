import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, updateProfile, uploadAvatar } from "@/apis/profile.api";
import { currentUserQueryKey } from "@/hooks/useAuth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currentUserQueryKey }),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currentUserQueryKey }),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
