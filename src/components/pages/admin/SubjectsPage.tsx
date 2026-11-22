"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { RowActions } from "@/components/ui/RowActions";
import type { Subject } from "@/apis/subjects.api";
import { useCreateIntent } from "@/hooks/useCreateIntent";
import { useDeleteSubject, useSubjects } from "@/hooks/useSubjects";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { SubjectForm } from "./SubjectForm";
import styles from "./admin.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form"; subject: Subject | null };

export function SubjectsPage() {
  const t = useTranslations("admin.subjects");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const subjectsQuery = useSubjects();
  const deleteSubject = useDeleteSubject();
  const [panel, setPanel] = useState<Panel>({ type: "none" });

  const { hiddenIds, requestDelete } = useUndoableDelete(deleteSubject.mutateAsync, t("deleted"));

  const openPanel = (nextPanel: Panel) => {
    setPanel(nextPanel);
  };
  useCreateIntent("subject", () => openPanel({ type: "form", subject: null }));
  const [search, setSearch] = useState("");

  // Backend не поддерживает поиск, список фильтруется на клиенте.
  const normalizedSearch = search.trim().toLowerCase();
  const subjects = (subjectsQuery.data ?? []).filter(
    (subject) =>
      !hiddenIds.has(subject.id) &&
      subject.name.toLowerCase().includes(normalizedSearch),
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
          action={
            normalizedSearch ? undefined : { label: t("add"), onClick: () => openPanel({ type: "form", subject: null }) }
          }
        />
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={cn(styles.table, styles.responsiveTable)}>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>
                <span className="sr-only">{tForm("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td data-label={t("name")}>{subject.name}</td>
                <td data-actions>
                  <RowActions
                    menuLabel={`${tForm("actions")}: ${subject.name}`}
                    primary={{ label: tForm("edit"), icon: Pencil, onSelect: () => openPanel({ type: "form", subject }) }}
                    actions={[
                      {
                        label: t("delete"),
                        icon: Trash2,
                        danger: true,
                        onSelect: () => requestDelete(subject.id),
                      },
                    ]}
                  />
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
