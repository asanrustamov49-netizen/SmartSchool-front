import { useFormatter, useLocale, useTranslations } from "next-intl";
import { getRelativeTimeParts } from "@/lib/utils";
import { useChoice } from "./useAppearance";

type DateInput = string | Date | null | undefined;

const EMPTY_DATE = "—";

// Строка вида "2026-11-24" — это календарная дата без времени: читаем её в локальном поясе,
// иначе new Date() примет её за полночь UTC и в западных поясах день сдвинется.
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const dateOnly = DATE_ONLY_PATTERN.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Форматирование дат для интерфейса.
// ru — как и раньше, через Intl (next-intl). ky — по словам из ky.json:
// во многих браузерах нет кыргызской локали Intl, и даты выводились бы по-русски.
export function useDateFormat() {
  const locale = useLocale();
  const format = useFormatter();
  const t = useTranslations("dates");
  const isKyrgyz = locale === "ky";
  const isNumeric = useChoice("dateFormat") === "numeric";

  const getWords = (key: "months" | "weekdays") => {
    const words = isKyrgyz ? t.raw(key) : [];
    return Array.isArray(words) ? words.map(String) : [];
  };

  const months = getWords("months");
  const weekdays = getWords("weekdays");

  const kyDay = (date: Date) => `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
  const kyYear = (date: Date) => t("year", { year: date.getFullYear() });

  // «Ишемби, 14-ноябрь» / «Суббота, 14 ноября»
  const formatLongDate = (value: DateInput) => {
    const date = toDate(value);
    if (!date) {
      return EMPTY_DATE;
    }

    if (isKyrgyz) {
      return `${weekdays[date.getDay()] ?? ""}, ${kyDay(date)}`;
    }

    return capitalize(format.dateTime(date, { weekday: "long", day: "numeric", month: "long" }));
  };

  // «24-ноябрь, 2026-ж.» / «24 нояб. 2026 г.»
  const formatDate = (value: DateInput) => {
    const date = toDate(value);
    if (!date) {
      return EMPTY_DATE;
    }

    if (isNumeric) {
      return `${padTime(date.getDate())}.${padTime(date.getMonth() + 1)}.${date.getFullYear()}`;
    }

    return isKyrgyz ? `${kyDay(date)}, ${kyYear(date)}` : format.dateTime(date, { dateStyle: "medium" });
  };

  // «14-ноябрь, 2026-ж., 15:07» / «14 нояб. 2026 г., 15:07»
  const formatDateTime = (value: DateInput) => {
    const date = toDate(value);
    if (!date) {
      return EMPTY_DATE;
    }

    if (isKyrgyz || isNumeric) {
      return `${formatDate(date)}, ${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
    }

    return format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
  };

  // «5 мүнөт мурун», «кечээ» / «5 минут назад».
  // Единицу для обоих языков выбирает getRelativeTimeParts — без «60 минут назад».
  const formatRelative = (value: DateInput) => {
    const date = toDate(value);
    if (!date) {
      return EMPTY_DATE;
    }

    const now = new Date();
    const parts = getRelativeTimeParts((now.getTime() - date.getTime()) / 1000);

    if (!isKyrgyz) {
      // Будущее и старше недели — как раньше, единицу подбирает Intl.
      return parts
        ? format.relativeTime(date, { now, unit: parts.unit })
        : format.relativeTime(date, now);
    }

    if (!parts) {
      return formatDate(date);
    }

    if (parts.unit === "second") {
      return t("justNow");
    }

    if (parts.unit === "minute") {
      return t("minutesAgo", { count: parts.value });
    }

    if (parts.unit === "hour") {
      return t("hoursAgo", { count: parts.value });
    }

    return parts.value === 1 ? t("yesterday") : t("daysAgo", { count: parts.value });
  };

  return { formatLongDate, formatDate, formatDateTime, formatRelative };
}
