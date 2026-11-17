"use client";

import { CircleAlert, Inbox, Plus, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./DataState.module.scss";

// Подсказка, что делать дальше, если список пуст: кнопка (onClick) или ссылка (href).
export type EmptyAction = {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
};

type DataStateProps =
  | { status: "loading" }
  | { status: "empty"; message: string; action?: EmptyAction }
  | { status: "error"; message: string; onRetry: () => void };

function EmptyActionButton({ action }: { action: EmptyAction }) {
  const Icon = action.icon ?? Plus;
  const content = (
    <>
      <Icon size={16} aria-hidden="true" />
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={styles.actionButton}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={styles.actionButton} onClick={action.onClick}>
      {content}
    </button>
  );
}

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
        <span className={styles.icon}>
          <Inbox size={20} aria-hidden="true" />
        </span>
        <span>{props.message}</span>
        {props.action && <EmptyActionButton action={props.action} />}
      </div>
    );
  }

  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <span className={`${styles.icon} ${styles.iconError}`}>
        <CircleAlert size={20} aria-hidden="true" />
      </span>
      <span>{props.message}</span>
      <button type="button" className={styles.retryButton} onClick={props.onRetry}>
        {t("retry")}
      </button>
    </div>
  );
}
