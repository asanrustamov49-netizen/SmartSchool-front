import api from "@/lib/axios";

// Поля взяты из backend: mysite/api/journal.py (serialize_assignment, get_journal).

// Журнал — это пара «класс + предмет» конкретного учителя.
export type JournalAssignment = {
  id: number;
  class_id: number;
  class_name: string | null;
  subject_id: number;
  subject_name: string | null;
  teacher_id: number;
  teacher_name: string | null;
  academic_year: string;
  can_edit: boolean;
};

// Б — был, Ж — отсутствовал без причины, К — опоздал,
// С — отсутствовал по одобренной заявке (ставит только backend).
export type AttendanceCode = "Б" | "Ж" | "К" | "С";

export type JournalRow = {
  number: number;
  student_id: number;
  full_name: string;
  entry_id: number | null;
  grade_value: number | null;
  attendance: AttendanceCode | null;
  comment: string | null;
  excused: boolean;
};

export type JournalDay = {
  assignment: JournalAssignment;
  date: string;
  can_edit: boolean;
  students: JournalRow[];
};

// Схема JournalSave: grade_value 2..5, comment до 500 символов.
export type JournalEntryInput = {
  student_id: number;
  grade_value: number | null;
  attendance: AttendanceCode | null;
  comment: string | null;
};

export async function getJournalAssignments(): Promise<JournalAssignment[]> {
  const response = await api.get<JournalAssignment[]>("/journal/assignments");
  return response.data;
}

export async function getJournalDay(assignmentId: number, day: string): Promise<JournalDay> {
  const response = await api.get<JournalDay>("/journal", {
    params: { assignment_id: assignmentId, day },
  });
  return response.data;
}

export async function saveJournalDay(data: {
  assignment_id: number;
  date: string;
  entries: JournalEntryInput[];
}) {
  await api.put("/journal", data);
}
