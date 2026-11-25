"use client";

import { ChevronRight, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProgramCard } from "@/apis/programs.api";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePrograms } from "@/hooks/usePrograms";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import { ProgramImport } from "./ProgramImport";
import styles from "./programs.module.scss";

function ProgressStatus({ card }: { card: ProgramCard }) {
  const t = useTranslations("programs");

  if (!card.has_program) {
    return <span className={cn(styles.status, styles.statusMuted)}>{t("noProgram")}</span>;
  }
  if (card.total > 0 && card.done === card.total) {
    return <span className={cn(styles.status, styles.statusDone)}>{t("finished")}</span>;
  }
  if (card.behind > 0) {
    return <span className={cn(styles.status, styles.statusBehind)}>{t("behind", { count: card.behind })}</span>;
  }
  return <span className={cn(styles.status, styles.statusOk)}>{t("onTrack")}</span>;
}

// «Программа»: предметы учителя по классам с прогрессом. Директор и завуч видят все классы
// и загружают программы из Excel.
export function ProgramsPage() {
  const t = useTranslations("programs");
  const tApiErrors = useTranslations("apiErrors");
  const currentUser = useCurrentUser().data;
  const isAdmin = currentUser?.role === "DIRECTOR" || currentUser?.role === "DEPUTY";
  const programsQuery = usePrograms();
  const [importOpen, setImportOpen] = useState(false);

  const renderCards = () => {
    if (programsQuery.isPending) {
      return <DataState status="loading" />;
    }
    if (programsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(programsQuery.error, tApiErrors)}
          onRetry={() => programsQuery.refetch()}
        />
      );
    }
    if (programsQuery.data.items.length === 0) {
      return <DataState status="empty" message={isAdmin ? t("emptyAdmin") : t("empty")} />;
    }

    return (
      <ul className={styles.cards}>
        {programsQuery.data.items.map((card) => {
          const percent = card.total > 0 ? Math.round((card.done / card.total) * 100) : 0;
          return (
            <li key={`${card.class_id}-${card.subject_id}`}>
              <Link href={`/programs/${card.class_id}/${card.subject_id}`} className={styles.card}>
                <span className={styles.cardTop}>
                  <span className={styles.cardTitle}>
                    <strong>{card.subject_name}</strong>
                    <span className={styles.classChip}>{card.class_name}</span>
                  </span>
                  <ChevronRight className={styles.cardArrow} size={18} aria-hidden="true" />
                </span>
                {isAdmin && <span className={styles.cardTeacher}>{card.teacher_name}</span>}

                <span
                  className={styles.progress}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={t("progressLabel", { done: card.done, total: card.total })}
                >
                  <span style={{ width: `${percent}%` }} />
                </span>

                <span className={styles.cardMeta}>
                  <span>{card.has_program ? t("topicsDone", { done: card.done, total: card.total }) : "—"}</span>
                  <ProgressStatus card={card} />
                </span>

                {card.next_topic && (
                  <span className={styles.nextTopic}>
                    <span>{t("next")}</span> {card.next_topic}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>
            {t("description")}
            {programsQuery.data && <> · {t("week", { week: programsQuery.data.current_week })}</>}
          </p>
        </div>
        {isAdmin && (
          <button type="button" className={adminStyles.primaryButton} onClick={() => setImportOpen((open) => !open)}>
            <Upload size={16} aria-hidden="true" />
            {t("upload")}
          </button>
        )}
      </header>

      {isAdmin && importOpen && <ProgramImport onClose={() => setImportOpen(false)} />}

      {renderCards()}
    </div>
  );
}
