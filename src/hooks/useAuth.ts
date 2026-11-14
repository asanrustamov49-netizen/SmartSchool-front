import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeFirstLoginPassword,
  getCurrentUser,
  login,
} from "@/apis/auth.api";
import { redirectToLogin, removeToken, saveToken } from "@/lib/auth";

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
    queryClient.clear();
    redirectToLogin();
  };
}
