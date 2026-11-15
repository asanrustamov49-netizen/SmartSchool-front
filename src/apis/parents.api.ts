import api from "@/lib/axios";
import { getApiErrorDetail } from "@/lib/errorHandler";

// POST /parents/register — схема ParentRegister (backend: mysite/api/parents.py).
// Родитель регистрируется сам и сразу привязывает первого ребёнка
// по ИНН ребёнка и временному паролю, который выдала школа.
export type ParentRegisterRequest = {
  inn: string;
  full_name: string;
  phone: string | null;
  password: string;
  student_inn: string;
  student_password: string;
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
  student_inn: string;
  student_password: string;
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
  | "childPasswordUsed"
  | "wrongChildCredentials"
  | "childAlreadyLinked"
  | "innTaken";

// Backend отвечает на эти ошибки только по-кыргызски и одним статусом 400,
// поэтому причина определяется по тексту detail из mysite/api/parents.py.
export function getParentLinkErrorKey(error: unknown): ParentLinkErrorKey | null {
  const detail = getApiErrorDetail(error) ?? "";

  if (detail.includes("Окуучу табылган жок")) {
    return "studentNotFound";
  }
  if (detail.includes("убактылуу паролу колдонулган")) {
    return "childPasswordUsed";
  }
  if (detail.includes("ИННи же паролу туура эмес")) {
    return "wrongChildCredentials";
  }
  if (detail.includes("ата-энеге байланышкан") || detail.includes("байланыштырылган")) {
    return "childAlreadyLinked";
  }
  if (detail.includes("ИНН мурда катталган")) {
    return "innTaken";
  }
  return null;
}
