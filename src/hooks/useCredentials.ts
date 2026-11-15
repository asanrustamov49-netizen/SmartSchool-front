import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClassCredentials, resetClassStudentPassword } from "@/apis/credentials.api";

function classCredentialsKey(classId: number) {
  return ["credentials", "class", classId];
}

export function useClassCredentials(classId: number) {
  return useQuery({
    queryKey: classCredentialsKey(classId),
    queryFn: () => getClassCredentials(classId),
  });
}

// После сброса у ученика снова временный пароль — список логинов обновляется.
export function useResetClassStudentPassword(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => resetClassStudentPassword(classId, studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classCredentialsKey(classId) }),
  });
}
