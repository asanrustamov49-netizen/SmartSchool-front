import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
  type SubjectCreate,
} from "@/apis/subjects.api";

const subjectsQueryKey = ["subjects"];

// Справочник меняется редко: 10 минут без перезапроса. После изменения кэш сбрасывается мутациями ниже.
export const subjectsQuery = queryOptions({
  queryKey: subjectsQueryKey,
  queryFn: getSubjects,
  staleTime: 10 * 60 * 1000,
});

export function useSubjects() {
  return useQuery(subjectsQuery);
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, data }: { subjectId: number; data: SubjectCreate }) =>
      updateSubject(subjectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  });
}
