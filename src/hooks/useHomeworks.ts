import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHomework,
  deleteHomework,
  getHomeworks,
  getHomeworkSubmissions,
  submitHomework,
} from "@/apis/homeworks.api";

const homeworksQueryKey = ["homeworks"];

export function useHomeworks(studentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: [...homeworksQueryKey, "list", studentId],
    queryFn: () => getHomeworks(studentId),
    enabled,
  });
}

export function useHomeworkSubmissions(homeworkId: number | null) {
  return useQuery({
    queryKey: [...homeworksQueryKey, "submissions", homeworkId],
    queryFn: () => getHomeworkSubmissions(homeworkId ?? 0),
    enabled: homeworkId !== null,
  });
}

function useHomeworkMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: homeworksQueryKey }),
  });
}

export function useCreateHomework() {
  return useHomeworkMutation(createHomework);
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: (_, homeworkId) => {
      // Ответы удалённого задания больше не запрашиваем: иначе открытая панель получит 404.
      queryClient.removeQueries({ queryKey: [...homeworksQueryKey, "submissions", homeworkId] });
      queryClient.invalidateQueries({ queryKey: [...homeworksQueryKey, "list"] });
    },
  });
}

export function useSubmitHomework() {
  return useHomeworkMutation(
    ({ homeworkId, text, files }: { homeworkId: number; text: string; files: File[] }) =>
      submitHomework(homeworkId, { text, files }),
  );
}
