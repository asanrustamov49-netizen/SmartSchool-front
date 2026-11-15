import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChild, registerParent } from "@/apis/parents.api";
import { saveToken } from "@/lib/auth";
import { currentUserQueryKey } from "./useAuth";

// После регистрации backend сразу выдаёт токен — родитель попадает в кабинет без отдельного входа.
export function useRegisterParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerParent,
    onSuccess: (response) => {
      saveToken(response.access_token);
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
    },
  });
}

// Список детей родителя приходит в /me (children), поэтому после привязки обновляется /me.
export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}
