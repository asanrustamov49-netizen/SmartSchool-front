"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { useOlympiadCandidates, useRemoveOlympiadCandidate } from "@/hooks/useOlympiad";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./olympiad.module.scss";

export function OlympiadCandidates() {
  const t = useTranslations("olympiad");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const candidatesQuery = useOlympiadCandidates();
  const removeCandidate = useRemoveOlympiadCandidate();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const renderList = () => {
    if (candidatesQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (candidatesQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(candidatesQuery.error, tApiErrors)}
          onRetry={() => candidatesQuery.refetch()}
        />
      );
    }

    if (candidatesQuery.data.length === 0) {
      return <DataState status="empty" message={t("noCandidates")} />;
    }

    return (
      <div className={adminStyles.tableWrap}>
        <table className={cn(adminStyles.table, adminStyles.responsiveTable)}>
          <thead>
            <tr>
              <th>{t("subject")}</th>
              <th>{t("student")}</th>
              <th>{t("status")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {candidatesQuery.data.map((candidate) => (
              <tr key={candidate.id}>
                <td data-label={t("subject")}>{candidate.subject_name ?? "—"}</td>
                <td data-label={t("student")}>{candidate.student_name ?? "—"}</td>
                <td data-label={t("status")}>
                  <span
                    className={cn(
                      styles.badge,
                      candidate.status === "SELECTED" ? styles.badgeSelected : styles.badgeSuggested,
                    )}
                  >
                    {candidate.status === "SELECTED" ? t("selected") : t("suggested")}
                  </span>
                </td>
                <td data-actions>
                  <div className={adminStyles.rowActions}>
                    {confirmId === candidate.id ? (
                      <>
                        <button
                          type="button"
                          className={adminStyles.linkButton}
                          onClick={() => setConfirmId(null)}
                        >
                          {tForm("cancel")}
                        </button>
                        <button
                          type="button"
                          className={adminStyles.dangerLink}
                          disabled={removeCandidate.isPending}
                          onClick={() =>
                            removeCandidate.mutate(candidate.id, { onSuccess: () => setConfirmId(null) })
                          }
                        >
                          {t("confirmRemove")}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={adminStyles.dangerLink}
                        onClick={() => setConfirmId(candidate.id)}
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className={adminStyles.card}>
      <h2 className={adminStyles.cardTitle}>{t("candidatesTitle")}</h2>
      {removeCandidate.isError && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(removeCandidate.error, tApiErrors)}
        </p>
      )}
      {renderList()}
    </section>
  );
}
