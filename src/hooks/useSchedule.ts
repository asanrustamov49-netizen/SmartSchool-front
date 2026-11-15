import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createScheduleLesson,
  deleteScheduleLesson,
  getClassSchedule,
  getMySchedule,
  getScheduleBells,
  getTodaySchedule,
  updateScheduleLesson,
  type ScheduleLessonInput,
} from "@/apis/schedule.api";

const scheduleQueryKey = ["schedule"];

export function useScheduleBells() {
  return useQuery({
    queryKey: [...scheduleQueryKey, "bells"],
    queryFn: getScheduleBells,
    staleTime: 60 * 60 * 1000,
  });
}

export function useClassSchedule(classId: number | null) {
  return useQuery({
    queryKey: [...scheduleQueryKey, "class", classId],
    queryFn: () => getClassSchedule(classId ?? 0),
    enabled: classId !== null,
  });
}

export function useMySchedule(studentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: [...scheduleQueryKey, "me", studentId],
    queryFn: () => getMySchedule(studentId),
    enabled,
  });
}

export function useTodaySchedule(studentId: number | null) {
  return useQuery({
    queryKey: [...scheduleQueryKey, "today", studentId],
    queryFn: () => getTodaySchedule(studentId),
  });
}

export function useSaveScheduleLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: number | null; data: ScheduleLessonInput }) =>
      lessonId === null ? createScheduleLesson(data) : updateScheduleLesson(lessonId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKey }),
  });
}

export function useDeleteScheduleLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScheduleLesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKey }),
  });
}
