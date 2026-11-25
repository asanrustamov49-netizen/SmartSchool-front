"use client";

import { CalendarClock, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Homework } from "@/apis/homeworks.api";
import { useDateFormat } from "@/hooks/useDateFormat";
import { cn, getMediaUrl } from "@/lib/utils";
import styles from "./homeworks.module.scss";

export type HomeworkStatus = "submitted" | "overdue" | "pending" | "noDeadline";

export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Статус для ученика и родителя: сдано, просрочено, ждёт сдачи или без срока.
export function getHomeworkStatus(homework: Homework): HomeworkStatus {
  if (homework.is_submitted) {
    return "submitted";
  }
  if (!homework.due_date) {
    return "noDeadline";
  }
  return homework.due_date < todayString() ? "overdue" : "pending";
}

// Сколько полных дней осталось до срока: 0 — сегодня, 1 — завтра.
function daysUntil(dueDate: string) {
  const [year, month, day] = dueDate.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = todayString().split("-").map(Number);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / millisecondsPerDay);
}

// Ссылки на файлы заданий подписаны (?exp=…&sig=…) — подпись в имя файла не попадает.
export function fileNameFromUrl(url: string) {
  const path = url.split("?")[0];
  return decodeURIComponent(path.split("/").pop() ?? path);
}

// Список прикреплённых файлов: картинки — превью, документы — ссылки.
export function AttachmentList({ images, files }: { images: string[]; files: string[] }) {
  if (images.length === 0 && files.length === 0) {
    return null;
  }

  return (
    <div className={styles.attachments}>
      {images.length > 0 && (
        <div className={styles.images}>
          {images.map((url) => (
            <a key={url} href={getMediaUrl(url)} target="_blank" rel="noreferrer" className={styles.imageLink}>
              {/* eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API */}
              <img src={getMediaUrl(url)} alt="" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <ul className={styles.files}>
          {files.map((url) => (
            <li key={url}>
              <a href={getMediaUrl(url)} target="_blank" rel="noreferrer">
                <FileText size={15} aria-hidden="true" />
                {fileNameFromUrl(url)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type HomeworkCardProps = {
  homework: Homework;
  // Ученик и родитель видят статус сдачи, учитель — класс.
  status?: HomeworkStatus;
  children?: ReactNode;
};

export function HomeworkCard({ homework, status, children }: HomeworkCardProps) {
  const t = useTranslations("homeworks");
  const { formatDate } = useDateFormat();
  // Ученику и родителю подсказываем, сколько осталось: «завтра» понятнее, чем дата.
  const daysLeft = status === "pending" && homework.due_date ? daysUntil(homework.due_date) : null;

  const getDaysLeftText = (days: number) => {
    if (days === 0) {
      return t("dueToday");
    }
    if (days === 1) {
      return t("dueTomorrow");
    }
    return t("dueInDays", { count: days });
  };

  return (
    <article className={cn(styles.card, status && styles[`card_${status}`])}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.subject}>{homework.subject_name}</span>
          <h3>{homework.title}</h3>
          <small>
            {status ? homework.teacher_name : homework.class_name} ·{" "}
            {t("given", { date: formatDate(homework.created_at) })}
          </small>
        </div>
        {status && <span className={cn(styles.status, styles[`status_${status}`])}>{t(`status.${status}`)}</span>}
      </header>

      {homework.due_date && (
        <p className={styles.due}>
          <CalendarClock size={15} aria-hidden="true" />
          {t("dueDate", { date: formatDate(homework.due_date) })}
          {daysLeft !== null && (
            <span className={cn(styles.daysLeft, daysLeft <= 1 && styles.daysLeftUrgent)}>
              {getDaysLeftText(daysLeft)}
            </span>
          )}
        </p>
      )}

      {homework.description && <p className={styles.description}>{homework.description}</p>}

      <AttachmentList images={homework.image_urls} files={homework.file_urls} />

      {children}
    </article>
  );
}
