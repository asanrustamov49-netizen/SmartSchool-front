import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDiary,
  getGradesSummary,
  getJournalAssignments,
  getJournalDay,
  saveJournalDay,
} from "@/apis/journal.api";

export function useJournalAssignments() {
  return useQuery({
    queryKey: ["journal", "assignments"],
    queryFn: getJournalAssignments,
  });
}

export function useJournalDay(assignmentId: number | null, day: string) {
  return useQuery({
    queryKey: ["journal", "day", assignmentId, day],
    queryFn: () => getJournalDay(assignmentId ?? 0, day),
    enabled: assignmentId !== null && day !== "",
  });
}

export function useSaveJournalDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJournalDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "day"] });
      // Оценки пересчитывают XP: меняются рейтинги, значки и кандидаты олимпиады.
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["olympiad"] });
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
