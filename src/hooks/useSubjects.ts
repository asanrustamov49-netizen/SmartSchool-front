import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubject, getSubjects } from "@/apis/subjects.api";

const subjectsQueryKey = ["subjects"];

export function useSubjects() {
  return useQuery({
    queryKey: subjectsQueryKey,
    queryFn: getSubjects,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  });
}
