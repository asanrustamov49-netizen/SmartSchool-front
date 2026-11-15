"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AbsenceStatus } from "@/apis/absence.api";
import { DataState } from "@/components/ui/DataState";
import { useAbsenceRequests } from "@/hooks/useAbsenceRequests";
import { useCurrentUser } from "@/hooks/useAuth";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { AbsenceForm } from "./AbsenceForm";
import { AbsenceRequestCard } from "./AbsenceRequestCard";
import adminStyles from "../admin/admin.module.scss";
import styles from "./absence.module.scss";

const STATUS_FILTERS: (AbsenceStatus | null)[] = [null, "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

// Права по backend: родитель подаёт и отменяет свои заявки, классный руководитель
// одобряет и отклоняет заявки своего класса, директор и завуч видят все заявки школы.
export function AbsencePage() {
  const t = useTranslations("absence");
  const tApiErrors = useTranslations("apiErrors");
  const currentUserQuery = useCurrentUser();
  const [status, setStatus] = useState<AbsenceStatus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const requestsQuery = useAbsenceRequests(status);

  const user = currentUserQuery.data;
  const isParent = user?.role === "PARENT";
  const isReviewer = user?.role === "TEACHER" || user?.role === "CLASS_TEACHER";

  const renderList = () => {
    if (requestsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (requestsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(requestsQuery.error, tApiErrors)}
          onRetry={() => requestsQuery.refetch()}
        />
      );
    }

    if (requestsQuery.data.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ul className={styles.list}>
        {requestsQuery.data.map((request) => (
          <AbsenceRequestCard
            key={request.id}
            request={request}
            canReview={isReviewer}
            canCancel={isParent}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{isParent ? t("titleParent") : t("title")}</h1>
          <p>{isParent ? t("descriptionParent") : t("description")}</p>
        </div>
        {isParent && !isFormOpen && (
          <button type="button" className={adminStyles.primaryButton} onClick={() => setIsFormOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {isParent && isFormOpen && user && (
        <AbsenceForm childrenList={user.children ?? []} onClose={() => setIsFormOpen(false)} />
      )}

      <section className={adminStyles.card}>
        <div className={styles.tabs} role="tablist" aria-label={t("statusFilter")}>
          {STATUS_FILTERS.map((item) => (
            <button
              key={item ?? "all"}
              type="button"
              role="tab"
              aria-selected={status === item}
              className={cn(styles.tab, status === item && styles.tabActive)}
              onClick={() => setStatus(item)}
            >
              {item ? t(`status.${item}`) : t("all")}
            </button>
          ))}
        </div>
        {renderList()}
      </section>
    </div>
  );
}
