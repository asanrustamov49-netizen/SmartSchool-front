import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDeputy, deactivateDeputy, getDeputies } from "@/apis/deputies.api";
import { resetUserPassword } from "@/apis/users.api";

const deputiesQueryKey = ["deputies"];

export function useDeputies() {
  return useQuery({ queryKey: deputiesQueryKey, queryFn: getDeputies });
}

function useInvalidateDeputies() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: deputiesQueryKey });
}

export function useCreateDeputy() {
  const invalidateDeputies = useInvalidateDeputies();
  return useMutation({ mutationFn: createDeputy, onSuccess: invalidateDeputies });
}

export function useDeactivateDeputy() {
  const invalidateDeputies = useInvalidateDeputies();
  return useMutation({ mutationFn: deactivateDeputy, onSuccess: invalidateDeputies });
}

// После сброса в списке появляется новый временный пароль, поэтому список обновляется.
export function useResetDeputyPassword() {
  const invalidateDeputies = useInvalidateDeputies();
  return useMutation({ mutationFn: resetUserPassword, onSuccess: invalidateDeputies });
}
