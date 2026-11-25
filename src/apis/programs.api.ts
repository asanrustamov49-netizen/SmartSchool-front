import { AxiosError } from "axios";
import api from "@/lib/axios";

// Окуу программасы — календарно-тематический план (backend: mysite/api/programs.py).
// Программа одна на предмет и параллель, прогресс («пройдено») у каждого класса свой.

// Карточка «предмет · класс» в списке программ.
export type ProgramCard = {
  class_id: number;
  class_name: string;
  grade_number: number;
  subject_id: number;
  subject_name: string;
  teacher_name: string;
  has_program: boolean;
  total: number;
  done: number;
  // На сколько тем класс отстаёт от плана по неделям (0 — по плану).
  behind: number;
  next_topic: string | null;
};

export type ProgramList = {
  current_week: number;
  items: ProgramCard[];
};

export type ProgramTopic = {
  id: number;
  position: number;
  section: string | null;
  title: string;
  hours: number;
  week: number | null;
  goals: string | null;
  materials: string | null;
  done_on: string | null;
  note: string | null;
};

export type ClassProgram = {
  class_id: number;
  class_name: string;
  grade_number: number;
  subject_id: number;
  subject_name: string;
  current_week: number;
  updated_at: string | null;
  topics: ProgramTopic[];
};

export type TopicProgressUpdate = {
  done: boolean;
  note?: string | null;
};

export type ImportRowError = { row: number; error: string };

export async function getPrograms(): Promise<ProgramList> {
  const response = await api.get<ProgramList>("/programs");
  return response.data;
}

export async function getClassProgram(classId: number, subjectId: number): Promise<ClassProgram> {
  const response = await api.get<ClassProgram>(`/programs/class/${classId}/subject/${subjectId}`);
  return response.data;
}

export async function updateTopicProgress(
  classId: number,
  subjectId: number,
  topicId: number,
  data: TopicProgressUpdate,
): Promise<{ topic_id: number; done_on: string | null; note: string | null }> {
  const response = await api.put(`/programs/class/${classId}/subject/${subjectId}/topics/${topicId}`, data);
  return response.data;
}

// Excel: «Бөлүм | Тема | Саат | Апта | Максаттар | Материалдар». Старая программа предмета заменяется.
export async function importProgram(data: { subjectId: number; gradeNumber: number; file: File }) {
  const formData = new FormData();
  formData.append("subject_id", String(data.subjectId));
  formData.append("grade_number", String(data.gradeNumber));
  formData.append("file", data.file);
  const response = await api.post<{ topics_count: number }>("/programs/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function downloadProgramTemplate(): Promise<Blob> {
  const response = await api.get<Blob>("/admin/excel/templates/program", { responseType: "blob" });
  return response.data;
}

// При ошибках в строках backend отвечает { detail: { message, errors: [{ row, error }] } }.
export function getImportRowErrors(error: unknown): ImportRowError[] {
  if (!(error instanceof AxiosError)) {
    return [];
  }
  const data: unknown = error.response?.data;
  if (typeof data !== "object" || data === null || !("detail" in data)) {
    return [];
  }
  const detail = data.detail;
  if (typeof detail !== "object" || detail === null || !("errors" in detail) || !Array.isArray(detail.errors)) {
    return [];
  }
  return detail.errors.filter(
    (item: unknown): item is ImportRowError =>
      typeof item === "object" && item !== null && "row" in item && "error" in item,
  );
}
