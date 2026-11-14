import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  getClassStudents,
  getStudents,
  updateStudent,
  type StudentUpdate,
} from "@/apis/students.api";

const studentsQueryKey = ["students"];

export function useStudents() {
  return useQuery({
    queryKey: studentsQueryKey,
    queryFn: getStudents,
  });
}

export function useClassStudents(classId: number) {
  return useQuery({
    queryKey: [...studentsQueryKey, "class", classId],
    queryFn: () => getClassStudents(classId),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
      // Число учеников показывается на главной.
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: number; data: StudentUpdate }) =>
      updateStudent(studentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentsQueryKey }),
  });
}
