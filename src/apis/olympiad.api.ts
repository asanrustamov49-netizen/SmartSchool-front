import api from "@/lib/axios";

// Поля взяты из backend: mysite/api/olympiad.py и services/rating.py (rank).

export type CandidateStatus = "SUGGESTED" | "SELECTED";

export type OlympiadTopStudent = {
  rank: number;
  student_id: number;
  full_name: string;
  class_name: string | null;
  xp: number;
  candidate_id: number | null;
  candidate_status: CandidateStatus | null;
};

export type OlympiadAnalytics = {
  grade_number: number | null;
  subjects: { subject_id: number; subject_name: string; top: OlympiadTopStudent[] }[];
};

export type OlympiadCandidate = {
  id: number;
  subject_id: number;
  subject_name: string | null;
  student_id: number;
  student_name: string | null;
  academic_year: string;
  status: CandidateStatus;
  note: string | null;
  created_at: string;
};

export async function getOlympiadAnalytics(gradeNumber: number | null): Promise<OlympiadAnalytics> {
  const response = await api.get<OlympiadAnalytics>("/olympiad/analytics", {
    params: gradeNumber ? { grade_number: gradeNumber } : undefined,
  });
  return response.data;
}

export async function getOlympiadCandidates(): Promise<OlympiadCandidate[]> {
  const response = await api.get<OlympiadCandidate[]>("/olympiad/candidates");
  return response.data;
}

// Директор и завуч добавляют сразу в курам (SELECTED).
export async function addOlympiadCandidate(data: { subject_id: number; student_id: number }) {
  await api.post("/olympiad/candidates", data);
}

export async function approveOlympiadCandidate(candidateId: number) {
  await api.post(`/olympiad/candidates/${candidateId}/approve`);
}

export async function autoSelectOlympiad(data: {
  subject_id: number;
  grade_number: number | null;
  limit: number;
}) {
  await api.post("/olympiad/auto-select", data);
}

export async function removeOlympiadCandidate(candidateId: number) {
  await api.delete(`/olympiad/candidates/${candidateId}`);
}
