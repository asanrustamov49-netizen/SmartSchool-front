import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateTeacher,
  createTeacher,
  deactivateTeacher,
  getTeachers,
  importTeachersExcel,
  updateTeacher,
  type TeacherUpdate,
} from "@/apis/teachers.api";

const teachersQueryKey = ["teachers"];

export function useTeachers() {
  return useQuery({
    queryKey: teachersQueryKey,
    queryFn: getTeachers,
  });
}

// Список учителей и их число на главной обновляются после любых изменений.
function useInvalidateTeachers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: teachersQueryKey });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };
}

export function useCreateTeacher() {
  const invalidateTeachers = useInvalidateTeachers();
  return useMutation({ mutationFn: createTeacher, onSuccess: invalidateTeachers });
}

export function useImportTeachers() {
  const invalidateTeachers = useInvalidateTeachers();
  return useMutation({ mutationFn: importTeachersExcel, onSuccess: invalidateTeachers });
}

export function useUpdateTeacher() {
  const invalidateTeachers = useInvalidateTeachers();

  return useMutation({
    mutationFn: ({ teacherId, data }: { teacherId: number; data: TeacherUpdate }) =>
      updateTeacher(teacherId, data),
    onSuccess: invalidateTeachers,
  });
}

export function useSetTeacherActive() {
  const queryClient = useQueryClient();
  const invalidateTeachers = useInvalidateTeachers();

  return useMutation({
    mutationFn: ({ teacherId, active }: { teacherId: number; active: boolean }) =>
      active ? activateTeacher(teacherId) : deactivateTeacher(teacherId),
    onSuccess: () => {
      invalidateTeachers();
      // Деактивация снимает классное руководство — меняются и классы.
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
