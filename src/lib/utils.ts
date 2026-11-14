import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Backend отдаёт файлы относительным путём (/media/...), они лежат на сервере API.
export function getMediaUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`;
}

// Пустая строка из необязательного поля формы уходит в API как null.
export function emptyToNull(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}
