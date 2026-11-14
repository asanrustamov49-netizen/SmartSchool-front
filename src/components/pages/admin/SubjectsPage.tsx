"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { useSubjects } from "@/hooks/useSubjects";
import { handleApiError } from "@/lib/errorHandler";
import { SubjectForm } from "./SubjectForm";
import styles from "./admin.module.scss";

export function SubjectsPage() {
  const t = useTranslations("admin.subjects");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const subjectsQuery = useSubjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("code")}</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.name}</td>
                <td className={styles.cellMuted}>{subject.code ?? "—"}</td>
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
        {!isFormOpen && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        )}
      </header>

      {isFormOpen && <SubjectForm onClose={() => setIsFormOpen(false)} />}

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
