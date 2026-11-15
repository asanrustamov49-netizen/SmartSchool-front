import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Backend отдаёт файлы относительным путём (/media/...), они лежат на сервере API.
export function getMediaUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`;
}

export type RelativeTimeParts = {
  unit: "second" | "minute" | "hour" | "day";
  value: number;
};

// Единица выбирается по уже округлённому значению, поэтому 59,5 минуты — это «1 час»,
// а не «60 минут», и 23,5 часа — «1 день», а не «24 часа».
// null — событие в будущем или старше недели: такой случай форматирует вызывающий код.
export function getRelativeTimeParts(secondsAgo: number): RelativeTimeParts | null {
  if (!Number.isFinite(secondsAgo) || secondsAgo < 0) {
    return null;
  }

  if (secondsAgo < 60) {
    return { unit: "second", value: Math.floor(secondsAgo) };
  }

  const minutes = Math.round(secondsAgo / 60);
  if (minutes < 60) {
    return { unit: "minute", value: minutes };
  }

  const hours = Math.round(secondsAgo / 3600);
  if (hours < 24) {
    return { unit: "hour", value: hours };
  }

  const days = Math.round(secondsAgo / 86400);
  if (days < 7) {
    return { unit: "day", value: days };
  }

  return null;
}

// Пустая строка из необязательного поля формы уходит в API как null.
export function emptyToNull(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

// Сохраняет файл, полученный от backend или собранный в браузере.
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
