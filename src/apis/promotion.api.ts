import api from "@/lib/axios";

// Перевод учеников на следующий учебный год (backend: mysite/api/student_promotion.py).
// Только директор. Ученики переходят в класс с той же буквой на параллель выше,
// 11-классники выпускаются, отмеченные ученики остаются на второй год.

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

export async function getPromotionPreview(sourceYear: string, targetYear: string): Promise<PromotionPreview> {
  const response = await api.get<PromotionPreview>("/students/promotion/preview", {
    params: { source_academic_year: sourceYear, target_academic_year: targetYear },
  });
  return response.data;
}

// Схема StudentPromotionRequest: excluded_student_ids — кто остаётся в своей параллели.
export async function executePromotion(data: {
  source_academic_year: string;
  target_academic_year: string;
  excluded_student_ids: number[];
}): Promise<PromotionResult> {
  const response = await api.post<PromotionResult>("/students/promotion/execute", data);
  return response.data;
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
