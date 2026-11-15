import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
  type SubjectCreate,
} from "@/apis/subjects.api";

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
