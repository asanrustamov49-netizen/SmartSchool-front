import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeacher, importTeachersExcel } from "@/apis/teachers.api";

// Списка учителей backend не отдаёт (нет GET /teachers), поэтому обновлять
// после создания можно только счётчик на главной.
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] }),
  });
}

export function useImportTeachers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importTeachersExcel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] }),
  });
}
