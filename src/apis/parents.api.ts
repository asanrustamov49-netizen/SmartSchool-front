import api from "@/lib/axios";
import { getApiErrorDetail, getApiErrorStatus } from "@/lib/errorHandler";

// POST /parents/register — схема ParentRegister (backend: mysite/api/parents.py).
// Родитель регистрируется сам и сразу привязывает первого ребёнка
// по коду для родителей, который выдал классный руководитель.
export type ParentRegisterRequest = {
  email: string;
  full_name: string;
  password: string;
  student_code: string;
};

export type ParentRegisterResponse = {
  message: string;
  parent_id: number;
  full_name: string;
  student: string;
  access_token: string;
  token_type: string;
};

// POST /parents/add-child — схема ParentAddChild.
export type ParentAddChildRequest = {
  student_code: string;
};

export type ParentAddChildResponse = {
  message: string;
  student_id: number;
  full_name: string;
};

export async function registerParent(data: ParentRegisterRequest): Promise<ParentRegisterResponse> {
  const response = await api.post<ParentRegisterResponse>("/parents/register", data);
  return response.data;
}

export async function addChild(data: ParentAddChildRequest): Promise<ParentAddChildResponse> {
  const response = await api.post<ParentAddChildResponse>("/parents/add-child", data);
  return response.data;
}

// Ключи раздела parentLink.errors в src/lib/locales/*.json.
export type ParentLinkErrorKey =
  | "studentNotFound"
  | "childAlreadyLinked"
  | "childLinkLimit"
  | "tooManyAttempts"
  | "emailTaken";

// Backend отвечает на эти ошибки только по-кыргызски и одним статусом 400,
// поэтому причина определяется по тексту detail из mysite/api/parents.py.
export function getParentLinkErrorKey(error: unknown): ParentLinkErrorKey | null {
  const detail = getApiErrorDetail(error) ?? "";

  // Защита от подбора кода: после многих неудачных попыток проверка на время закрыта.
  if (getApiErrorStatus(error) === 429) {
    return "tooManyAttempts";
  }

  if (detail.includes("окуучу табылган жок")) {
    return "studentNotFound";
  }
  // У ребёнка может быть не больше двух родителей (backend: MAX_PARENTS_PER_STUDENT).
  if (detail.includes("эки ата-эне байланган")) {
    return "childLinkLimit";
  }
  if (detail.includes("аккаунтуңузга мурда байланган") || detail.includes("байланыштырылган")) {
    return "childAlreadyLinked";
  }
  if (detail.includes("почта мурда катталган")) {
    return "emailTaken";
  }
  return null;
}

// Код для родителей: «k7p2-mx4q» → «K7P2MX4Q». Дефис и пробелы не важны (как в backend).
export function normalizeParentCode(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function isParentCode(value: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(normalizeParentCode(value));
}
