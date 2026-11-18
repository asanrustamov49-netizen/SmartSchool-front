import { AxiosError } from "axios";

// Формат ошибок FastAPI: { detail: "сообщение" } или, при 422,
// { detail: [{ loc: ["body", "inn"], msg: "...", type: "..." }] }
type FastApiValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

type FastApiErrorResponse = {
  detail?: string | FastApiValidationError[];
};

// Ключи из раздела apiErrors в src/lib/locales/*.json.
type ApiErrorKey = "network" | "server" | "unknown";

// Переводчик передаётся из компонента: useTranslations("apiErrors").
type ApiErrorTranslator = (key: ApiErrorKey) => string;

function getErrorDetail(error: AxiosError) {
  const data = error.response?.data as FastApiErrorResponse | undefined;
  return data?.detail;
}

// Текст detail приходит от backend как есть, без перевода.
export const handleApiError = (
  error: unknown,
  t: ApiErrorTranslator,
): string => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return t("network");
    }

    const detail = getErrorDetail(error);

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => String(item.msg).replace(/^Value error, /, "")).join(". ");
    }

    return t("server");
  }

  return t("unknown");
};

// Текст detail без перевода — когда ошибку нужно распознать по смыслу.
export const getApiErrorDetail = (error: unknown): string | undefined => {
  if (!(error instanceof AxiosError)) {
    return undefined;
  }

  const detail = getErrorDetail(error);
  return typeof detail === "string" ? detail : undefined;
};

export const getApiErrorStatus =(error: unknown): number | undefined => {
  return error instanceof AxiosError ? error.response?.status : undefined;
};

// Ошибки 422 по полям формы: { inn: "сообщение", password: "сообщение" }.
export const getApiFieldErrors = (error: unknown): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  if (!(error instanceof AxiosError) || error.response?.status !== 422) {
    return fieldErrors;
  }

  const detail = getErrorDetail(error);

  if (!Array.isArray(detail)) {
    return fieldErrors;
  }

  for (const item of detail) {
    const fieldName = item.loc[item.loc.length - 1];

    if (typeof fieldName === "string") {
      // Pydantic добавляет к тексту ValueError служебное «Value error, ».
      fieldErrors[fieldName] = String(item.msg).replace(/^Value error, /, "");
    }
  }

  return fieldErrors;
};
