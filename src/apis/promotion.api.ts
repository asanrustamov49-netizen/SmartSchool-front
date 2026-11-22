import api from "@/lib/axios";

// Перевод учеников на следующий учебный год (backend: mysite/api/student_promotion.py).
// Директор и завуч. Сначала все ученики переводятся автоматически: в класс с той же буквой
// на параллель выше, 11-классники выпускаются. Потом любого ученика можно перевести в другой класс.

export type PromotionStudent = {
  student_id: number;
  full_name: string;
  current_class: string;
  next_class: string | null;
  will_graduate: boolean;
};

export type PromotionPreview = {
  source_academic_year: string;
  target_academic_year: string;
  total_students: number;
  students: PromotionStudent[];
};

export type PromotionResult = {
  total_processed: number;
  promoted: number;
  repeated: number;
  graduated: number;
};

// Результат перевода: to_class = null — ученик выпустился.
export type PromotionReviewStudent = {
  student_id: number;
  full_name: string;
  from_class: string;
  from_grade: number;
  to_class: string | null;
  to_grade: number | null;
  to_letter: string | null;
};

export type PromotionReview = {
  source_academic_year: string;
  target_academic_year: string;
  students: PromotionReviewStudent[];
};

export type PromotionMove = {
  student_id: number;
  target_academic_year: string;
  grade_number: number;
  letter: string;
};

export async function getPromotionPreview(sourceYear: string, targetYear: string): Promise<PromotionPreview> {
  const response = await api.get<PromotionPreview>("/students/promotion/preview", {
    params: { source_academic_year: sourceYear, target_academic_year: targetYear },
  });
  return response.data;
}

export async function executePromotion(data: {
  source_academic_year: string;
  target_academic_year: string;
}): Promise<PromotionResult> {
  const response = await api.post<PromotionResult>("/students/promotion/execute", data);
  return response.data;
}

// Пустой список — перевод на этот год ещё не выполнялся.
export async function getPromotionReview(targetYear: string): Promise<PromotionReview> {
  const response = await api.get<PromotionReview>("/students/promotion/review", {
    params: { target_academic_year: targetYear },
  });
  return response.data;
}

// Нужного класса в новом году может не быть — backend создаёт его сам.
export async function moveStudent(data: PromotionMove) {
  await api.put("/students/promotion/move", data);
}

// «2025-2026» → «2026-2027». Backend принимает только соседние годы в таком формате.
export function getNextAcademicYear(year: string): string | null {
  const match = /^(\d{4})-(\d{4})$/.exec(year);
  if (!match) {
    return null;
  }
  const start = Number(match[1]) + 1;
  return `${start}-${start + 1}`;
}
