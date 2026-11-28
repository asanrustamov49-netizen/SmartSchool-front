import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDiary,
  getGradesSummary,
  getJournalAssignments,
  getJournalDay,
  getJournalMonth,
  getPeriodGrades,
  getStudentMonth,
  saveJournalDay,
  savePeriodGrades,
} from "@/apis/journal.api";

// Справочник меняется редко: 10 минут без перезапроса. После изменений кэш сбрасывают мутации.
export const journalAssignmentsQuery = queryOptions({
  queryKey: ["journal", "assignments"],
  queryFn: getJournalAssignments,
  staleTime: 10 * 60 * 1000,
});

export function useJournalAssignments() {
  return useQuery(journalAssignmentsQuery);
}

export const SAVE_JOURNAL_DAY_KEY = ["journal", "save-day"];

// gcTime: 0 — закрытый редактор дня не оставляет кэш: при повторном открытии
// оценки всегда берутся с сервера, а не из устаревшей копии до автосохранения.
export function useJournalDay(assignmentId: number | null, day: string, enabled = true) {
  return useQuery({
    queryKey: ["journal", "day", assignmentId, day],
    queryFn: () => getJournalDay(assignmentId ?? 0, day),
    enabled: enabled && assignmentId !== null && day !== "",
    gcTime: 0,
  });
}

export function useSaveJournalDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: SAVE_JOURNAL_DAY_KEY,
    mutationFn: saveJournalDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "day"] });
      queryClient.invalidateQueries({ queryKey: ["journal", "month"] });
      queryClient.invalidateQueries({ queryKey: ["journal", "periods"] });
      // Оценки пересчитывают XP: меняются рейтинги, значки и кандидаты олимпиады.
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["olympiad"] });
    },
  });
}

export function useJournalMonth(assignmentId: number | null, month: string) {
  return useQuery({
    queryKey: ["journal", "month", assignmentId, month],
    queryFn: () => getJournalMonth(assignmentId ?? 0, month),
    enabled: assignmentId !== null,
  });
}

export function useStudentMonth(studentId: number | null, month: string, enabled: boolean) {
  return useQuery({
    queryKey: ["journal", "student-month", studentId, month],
    queryFn: () => getStudentMonth(studentId, month),
    enabled,
  });
}

export function usePeriodGrades(assignmentId: number | null) {
  return useQuery({
    queryKey: ["journal", "periods", assignmentId],
    queryFn: () => getPeriodGrades(assignmentId ?? 0),
    enabled: assignmentId !== null,
  });
}

export function useSavePeriodGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePeriodGrades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "periods"] });
      // Итоговые оценки видны в сводке ученика.
      queryClient.invalidateQueries({ queryKey: ["journal", "summary"] });
    },
  });
}

export function useDiary(studentId: number | null, dateFrom: string, dateTo: string, enabled: boolean) {
  return useQuery({
    queryKey: ["journal", "diary", studentId, dateFrom, dateTo],
    queryFn: () => getDiary(studentId, dateFrom, dateTo),
    enabled,
  });
}

export function useGradesSummary(studentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["journal", "summary", studentId],
    queryFn: () => getGradesSummary(studentId),
    enabled,
  });
}
