"use client";

import { CircleAlert, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./DataState.module.scss";

type DataStateProps =
  | { status: "loading" }
  | { status: "empty"; message: string }
  | { status: "error"; message: string; onRetry: () => void };

// Общие состояния загрузки, пустого списка и ошибки для блоков с данными API.
export function DataState(props: DataStateProps) {
  const t = useTranslations("common");

  if (props.status === "loading") {
    return (
      <div className={styles.skeleton} aria-live="polite" aria-busy="true">
        <span className="sr-only">{t("loading")}</span>
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLine} />
      </div>
    );
  }

  if (props.status === "empty") {
    return (
      <div className={styles.state}>
        <Inbox size={20} aria-hidden="true" />
        <span>{props.message}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <CircleAlert size={20} aria-hidden="true" />
      <span>{props.message}</span>
      <button type="button" className={styles.retryButton} onClick={props.onRetry}>
        {t("retry")}
      </button>
    </div>
  );
}
