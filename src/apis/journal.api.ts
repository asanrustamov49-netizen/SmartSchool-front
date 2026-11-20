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

// ---------- Табель за месяц (backend: get_journal_month) ----------
// В cells только дни, где есть запись или одобренная заявка «С».

export type JournalMonthCell = {
  date: string;
  entry_id: number | null;
  grade_value: number | null;
  attendance: AttendanceCode | null;
  comment: string | null;
};

export type JournalMonthRow = {
  number: number;
  student_id: number;
  full_name: string;
  cells: JournalMonthCell[];
  average: number | null;
  grades_count: number;
  absent_count: number;
};

export type JournalMonth = {
  assignment: JournalAssignment;
  month: string;
  date_from: string;
  date_to: string;
  can_edit: boolean;
  // Дни недели урока по расписанию: 1 — понедельник … 6 — суббота.
  lesson_weekdays: number[];
  students: JournalMonthRow[];
};

// Табель ученика за месяц: строки — предметы (backend: get_student_month).
export type StudentMonthRow = {
  number: number;
  subject_id: number;
  subject_name: string;
  cells: JournalMonthCell[];
  average: number | null;
  grades_count: number;
  absent_count: number;
};

export type StudentMonth = {
  student_id: number;
  full_name: string;
  month: string;
  date_from: string;
  date_to: string;
  rows: StudentMonthRow[];
};

// ---------- Четвертные и годовые оценки (backend: get_period_grades) ----------

export type PeriodKey = "Q1" | "Q2" | "Q3" | "Q4" | "YEAR";

export type PeriodCell = {
  // Для четверти — средний балл текущих оценок, для года — среднее четвертных.
  average: number | null;
  grades_count: number;
  // Итоговая оценка, которую поставил учитель.
  final: number | null;
};

export type PeriodGradesRow = {
  number: number;
  student_id: number;
  full_name: string;
  grades: Record<PeriodKey, PeriodCell>;
};

export type PeriodGrades = {
  assignment: JournalAssignment;
  academic_year: string;
  can_edit: boolean;
  current_period: PeriodKey | null;
  periods: { key: PeriodKey; start: string; end: string }[];
  students: PeriodGradesRow[];
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

export async function getJournalMonth(assignmentId: number, month: string): Promise<JournalMonth> {
  const response = await api.get<JournalMonth>("/journal/month", {
    params: { assignment_id: assignmentId, month },
  });
  return response.data;
}

// studentId: null — ученик смотрит свой табель; родитель передаёт id ребёнка.
export async function getStudentMonth(studentId: number | null, month: string): Promise<StudentMonth> {
  const response = await api.get<StudentMonth>("/journal/my-month", {
    params: { student_id: studentId ?? undefined, month },
  });
  return response.data;
}

export async function getPeriodGrades(assignmentId: number): Promise<PeriodGrades> {
  const response = await api.get<PeriodGrades>("/journal/periods", {
    params: { assignment_id: assignmentId },
  });
  return response.data;
}

// grade_value: null снимает итоговую оценку.
export async function savePeriodGrades(data: {
  assignment_id: number;
  period: PeriodKey;
  entries: { student_id: number; grade_value: number | null }[];
}) {
  await api.put("/journal/periods", data);
}

export async function saveJournalDay(data: {
  assignment_id: number;
  date: string;
  entries: JournalEntryInput[];
}) {
  await api.put("/journal", data);
}

// ---------- Дневник ученика (backend: get_diary, get_summary) ----------
// Ученик видит свой дневник, родитель — дневник выбранного ребёнка (studentId).

export type DiaryLesson = {
  entry_id: number;
  subject_id: number;
  subject_name: string;
  teacher_name: string;
  grade_value: number | null;
  attendance: AttendanceCode | null;
  comment: string | null;
  xp: number;
};

export type Diary = {
  student_id: number;
  full_name: string;
  date_from: string;
  date_to: string;
  days: { date: string; lessons: DiaryLesson[] }[];
};

export type SubjectSummary = {
  subject_id: number;
  subject_name: string;
  grades_count: number;
  average: number | null;
  last_grades: number[];
  attendance: Partial<Record<AttendanceCode, number>>;
  xp: number;
  trend: { month: string; average: number }[];
  // Четвертные и годовая оценки за последний учебный год.
  // Необязательное: старый backend это поле не присылает.
  period_grades?: Partial<Record<PeriodKey, number>>;
};

export type GradesSummary = {
  student_id: number;
  full_name: string;
  overall_average: number | null;
  attendance: Partial<Record<AttendanceCode, number>>;
  subjects: SubjectSummary[];
};

export async function getDiary(studentId: number | null, dateFrom: string, dateTo: string): Promise<Diary> {
  const response = await api.get<Diary>("/journal/diary", {
    params: { student_id: studentId ?? undefined, date_from: dateFrom, date_to: dateTo },
  });
  return response.data;
}

export async function getGradesSummary(studentId: number | null): Promise<GradesSummary> {
  const response = await api.get<GradesSummary>("/journal/summary", {
    params: { student_id: studentId ?? undefined },
  });
  return response.data;
}
