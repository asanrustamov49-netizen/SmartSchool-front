"use client";

import { AlertCircle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import type { Subject } from "@/apis/subjects.api";
import { useDeleteSubject, useSubjects } from "@/hooks/useSubjects";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { SubjectForm } from "./SubjectForm";
import styles from "./admin.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; subject: Subject | null }
  | { type: "delete"; subject: Subject };

export function SubjectsPage() {
  const t = useTranslations("admin.subjects");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const subjectsQuery = useSubjects();
  const deleteSubject = useDeleteSubject();
  const [panel, setPanel] = useState<Panel>({ type: "none" });

  const openPanel = (nextPanel: Panel) => {
    deleteSubject.reset();
    setPanel(nextPanel);
  };
  const [search, setSearch] = useState("");

  // Backend не поддерживает поиск, список фильтруется на клиенте.
  const normalizedSearch = search.trim().toLowerCase();
  const subjects = (subjectsQuery.data ?? []).filter(
    (subject) =>
      subject.name.toLowerCase().includes(normalizedSearch) ||
      (subject.code ?? "").toLowerCase().includes(normalizedSearch),
  );

  const renderList = () => {
    if (subjectsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (subjectsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(subjectsQuery.error, tApiErrors)}
          onRetry={() => subjectsQuery.refetch()}
        />
      );
    }

    if (subjects.length === 0) {
      return (
        <DataState
          status="empty"
          message={normalizedSearch ? tForm("nothingFound") : t("empty")}
        />
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={cn(styles.table, styles.responsiveTable)}>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("code")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td data-label={t("name")}>{subject.name}</td>
                <td data-label={t("code")} className={styles.cellMuted}>{subject.code ?? "—"}</td>
                <td data-actions>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => openPanel({ type: "form", subject })}
                    >
                      {tForm("edit")}
                    </button>
                    <button
                      type="button"
                      className={styles.dangerLink}
                      onClick={() => openPanel({ type: "delete", subject })}
                    >
                      {t("delete")}
                    </button>
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
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        {panel.type !== "form" && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => openPanel({ type: "form", subject: null })}
          >
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {panel.type === "form" && (
        <SubjectForm
          key={panel.subject?.id ?? "new"}
          subject={panel.subject}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "delete" && (
        <section className={styles.card} role="alertdialog" aria-labelledby="subject-delete">
          <p id="subject-delete" className={styles.notice}>
            {t("confirmDelete", { name: panel.subject.name })}
          </p>
          {deleteSubject.isError && (
            <p className={styles.formError} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {handleApiError(deleteSubject.error, tApiErrors)}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => openPanel({ type: "none" })}
            >
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.primaryButton} ${styles.dangerButton}`}
              disabled={deleteSubject.isPending}
              onClick={() =>
                deleteSubject.mutate(panel.subject.id, { onSuccess: () => setPanel({ type: "none" }) })
              }
            >
              {t("delete")}
            </button>
          </div>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={tForm("search")}
            aria-label={tForm("search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {renderList()}
      </section>
    </div>
  );
}
