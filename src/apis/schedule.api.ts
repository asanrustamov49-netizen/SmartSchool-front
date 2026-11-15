import api from "@/lib/axios";

// Поля взяты из backend: mysite/api/schedule.py (serialize, get_bells).

// День недели: 1 — понедельник … 6 — суббота (воскресенья в расписании нет).
export type ScheduleLesson = {
  id: number;
  class_id: number;
  class_name: string | null;
  weekday: number;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  assignment_id: number;
  subject_id: number;
  subject_name: string | null;
  teacher_id: number;
  teacher_name: string | null;
  academic_year: string;
};

export type ScheduleBells = {
  weekdays: { weekday: number; name: string }[];
  bells: { lesson_number: number; start_time: string; end_time: string }[];
};

export type ScheduleWeek = {
  lessons: ScheduleLesson[];
};

// Схема ScheduleLessonCreate. Время не передаём: backend берёт его из звонков по номеру урока.
export type ScheduleLessonInput = {
  assignment_id: number;
  weekday: number;
  lesson_number: number;
  room: string | null;
};

export async function getScheduleBells(): Promise<ScheduleBells> {
  const response = await api.get<ScheduleBells>("/schedule/bells");
  return response.data;
}

export async function getClassSchedule(classId: number): Promise<ScheduleWeek> {
  const response = await api.get<ScheduleWeek>(`/schedule/class/${classId}`);
  return response.data;
}

// Своё расписание: учитель — свои уроки, ученик — свой класс,
// родитель — класс выбранного ребёнка (studentId обязателен, если детей несколько).
export async function getMySchedule(studentId: number | null): Promise<ScheduleWeek> {
  const response = await api.get<ScheduleWeek>("/schedule/me", {
    params: studentId ? { student_id: studentId } : undefined,
  });
  return response.data;
}

export async function getTodaySchedule(studentId: number | null): Promise<ScheduleWeek> {
  const response = await api.get<ScheduleWeek>("/schedule/today", {
    params: studentId ? { student_id: studentId } : undefined,
  });
  return response.data;
}

export async function createScheduleLesson(data: ScheduleLessonInput): Promise<ScheduleLesson> {
  const response = await api.post<ScheduleLesson>("/schedule", data);
  return response.data;
}

export async function updateScheduleLesson(
  lessonId: number,
  data: ScheduleLessonInput,
): Promise<ScheduleLesson> {
  const response = await api.put<ScheduleLesson>(`/schedule/${lessonId}`, data);
  return response.data;
}

export async function deleteScheduleLesson(lessonId: number) {
  await api.delete(`/schedule/${lessonId}`);
}
