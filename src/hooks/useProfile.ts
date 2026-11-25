import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, updateProfile, uploadAvatar } from "@/apis/profile.api";
import type { CurrentUser } from "@/apis/auth.api";
import { currentUserQueryKey } from "@/hooks/useAuth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      // PUT /me возвращает только поля профиля: они накладываются на уже загруженный /me.
      queryClient.setQueryData<CurrentUser>(currentUserQueryKey, (current) =>
        current ? { ...current, ...profile } : current,
      );
      return queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
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
