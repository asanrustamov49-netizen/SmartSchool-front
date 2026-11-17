"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import { useJournalAssignments, useJournalDay } from "@/hooks/useJournal";
import { handleApiError } from "@/lib/errorHandler";
import { JournalTable } from "./JournalTable";
import adminStyles from "../admin/admin.module.scss";
import styles from "./journal.module.scss";

// Дата в формате YYYY-MM-DD по местному времени (toISOString дал бы дату по UTC).
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function JournalPage() {
  const t = useTranslations("journal");
  const tApiErrors = useTranslations("apiErrors");
  const today = getTodayString();
  const assignmentsQuery = useJournalAssignments();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [day, setDay] = useState(today);

  const assignments = assignmentsQuery.data ?? [];
  const assignmentId = selectedId ?? assignments[0]?.id ?? null;
  const dayQuery = useJournalDay(assignmentId, day);

  const renderJournal = () => {
    if (assignmentsQuery.isPending || (assignmentId !== null && dayQuery.isPending)) {
      return <DataState status="loading" />;
    }

    if (assignmentsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(assignmentsQuery.error, tApiErrors)}
          onRetry={() => assignmentsQuery.refetch()}
        />
      );
    }

    if (assignments.length === 0) {
      return <DataState status="empty" message={t("noAssignments")} />;
    }

    if (dayQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(dayQuery.error, tApiErrors)}
          onRetry={() => dayQuery.refetch()}
        />
      );
    }

    if (!dayQuery.data) {
      return null;
    }

    if (dayQuery.data.students.length === 0) {
      return <DataState status="empty" message={t("noStudents")} />;
    }

    // key сбрасывает черновик оценок при смене журнала или даты.
    return (
      <JournalTable
        key={`${assignmentId}-${day}`}
        journal={dayQuery.data}
        isFutureDay={day > today}
      />
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>

      <section className={adminStyles.card}>
        <div className={adminStyles.toolbar}>
          <Select
            ariaLabel={t("assignment")}
            value={assignmentId === null ? "" : String(assignmentId)}
            disabled={assignments.length === 0}
            onValueChange={(value) => setSelectedId(Number(value))}
            options={assignments.map((assignment) => ({
              value: String(assignment.id),
              label: [assignment.class_name, assignment.subject_name, assignment.teacher_name]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
          <input
            type="date"
            className={`${adminStyles.input} ${styles.dateInput}`}
            aria-label={t("date")}
            value={day}
            max={today}
            onChange={(event) => setDay(event.target.value || today)}
          />
        </div>
        {renderJournal()}
      </section>
    </div>
  );
}
