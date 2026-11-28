import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deactivateStudent,
  getClassStudents,
  getStudentHistory,
  getStudentProfile,
  getStudents,
  importStudentsExcel,
  updateStudent,
  type StudentUpdate,
} from "@/apis/students.api";

const studentsQueryKey = ["students"];

// Список учеников меняет только администрация, и мутации сразу сбрасывают кэш.
export const studentsQuery = queryOptions({
  queryKey: studentsQueryKey,
  queryFn: getStudents,
  staleTime: 5 * 60 * 1000,
});

export function useStudents() {
  return useQuery(studentsQuery);
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

function useInvalidateStudents() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };
}

export function useImportStudents() {
  const invalidateStudents = useInvalidateStudents();

  return useMutation({
    mutationFn: ({ classId, file }: { classId: number; file: Blob }) =>
      importStudentsExcel(classId, file),
    onSuccess: invalidateStudents,
  });
}

export function useDeactivateStudent() {
  const invalidateStudents = useInvalidateStudents();

  return useMutation({
    mutationFn: deactivateStudent,
    onSuccess: invalidateStudents,
  });
}

export function useStudentHistory(studentId: number) {
  return useQuery({
    queryKey: [...studentsQueryKey, "history", studentId],
    queryFn: () => getStudentHistory(studentId),
  });
}

export function useStudentProfile(studentId: number) {
  return useQuery({
    queryKey: [...studentsQueryKey, "profile", studentId],
    queryFn: () => getStudentProfile(studentId),
  });
}
