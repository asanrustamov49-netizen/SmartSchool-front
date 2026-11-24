import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeFirstLoginPassword,
  getCurrentUser,
  login,
  requestPasswordReset,
  resetPassword,
} from "@/apis/auth.api";
import { resetAppearance } from "@/lib/appearance";
import { redirectToLogin, removeToken, saveToken } from "@/lib/auth";
import { resetSelectedChild } from "./useSelectedChild";

export const currentUserQueryKey = ["current-user"];

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (tokenResponse) => {
      saveToken(tokenResponse.access_token);
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export function useFirstLoginChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeFirstLoginPassword,
    onSuccess: (tokenResponse) => {
      saveToken(tokenResponse.access_token);
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
    },
  });
}

// У backend нет endpoint'а для выхода: достаточно удалить токен на клиенте.
// Переход делается полной перезагрузкой: Next.js хранит посещённые страницы смонтированными
// в скрытом виде, и без перезагрузки форма входа осталась бы в состоянии «Вход...»,
// а страницы прошлого пользователя — в памяти.
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    removeToken();
    resetAppearance();
    resetSelectedChild();
    queryClient.clear();
    redirectToLogin();
  };
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
