"use client";

import { CircleAlert, LoaderCircle, MessageSquareText, Paperclip, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MAX_HOMEWORK_FILES } from "@/apis/homeworks.api";
import { DataState } from "@/components/ui/DataState";
import { Select } from "@/components/ui/Select";
import { useCreateIntent } from "@/hooks/useCreateIntent";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  useCreateHomework,
  useDeleteHomework,
  useHomeworkSubmissions,
  useHomeworks,
} from "@/hooks/useHomeworks";
import { useJournalAssignments } from "@/hooks/useJournal";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { AttachmentList, HomeworkCard } from "./HomeworkCard";
import adminStyles from "../admin/admin.module.scss";
import styles from "./homeworks.module.scss";

function HomeworkForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("homeworks");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const assignmentsQuery = useJournalAssignments();
  const createHomework = useCreateHomework();
  // Задание можно дать только по своему предмету (can_edit), а не по классу, где ты классный руководитель.
  const ownAssignments = (assignmentsQuery.data ?? []).filter((assignment) => assignment.can_edit);
  const [assignmentId, setAssignmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const titleTooShort = title.trim().length < 2;

  return (
    <section className={adminStyles.card}>
      <h2 className={adminStyles.cardTitle}>{t("createTitle")}</h2>

      {createHomework.isError && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(createHomework.error, tApiErrors)}
        </p>
      )}

      <div className={adminStyles.form}>
        <div className={adminStyles.field}>
          <label htmlFor="homework-assignment">{t("classSubject")}</label>
          <Select
            id="homework-assignment"
            value={assignmentId}
            onValueChange={setAssignmentId}
            placeholder={tForm("choose")}
            options={ownAssignments.map((assignment) => ({
              value: String(assignment.id),
              label: `${assignment.class_name} · ${assignment.subject_name}`,
            }))}
          />
          {!assignmentsQuery.isPending && ownAssignments.length === 0 && (
            <span className={adminStyles.fieldHint}>{t("noAssignments")}</span>
          )}
        </div>

        <div className={adminStyles.field}>
          <label htmlFor="homework-due">{t("dueLabel")}</label>
          <input
            id="homework-due"
            type="date"
            className={adminStyles.input}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <span className={adminStyles.fieldHint}>{tForm("optional")}</span>
        </div>

        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <label htmlFor="homework-title">{t("titleLabel")}</label>
          <input
            id="homework-title"
            className={adminStyles.input}
            maxLength={200}
            placeholder={t("titlePlaceholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <label htmlFor="homework-description">{t("descriptionLabel")}</label>
          <textarea
            id="homework-description"
            rows={4}
            className={`${adminStyles.input} ${adminStyles.textarea}`}
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <span>{t("attachments")}</span>
          <label className={adminStyles.fileLabel}>
            <Paperclip size={16} aria-hidden="true" />
            {files.length > 0 ? t("filesChosen", { count: files.length }) : t("attachFiles")}
            <input
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_HOMEWORK_FILES))}
            />
          </label>
          <span className={adminStyles.fieldHint}>{t("teacherFilesHint", { count: MAX_HOMEWORK_FILES })}</span>
        </div>

        <div className={adminStyles.formActions}>
          <button type="button" className={adminStyles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button
            type="button"
            className={adminStyles.primaryButton}
            disabled={assignmentId === "" || titleTooShort || createHomework.isPending}
            onClick={() =>
              createHomework.mutate(
                { assignment_id: Number(assignmentId), title, description, due_date: dueDate, files },
                { onSuccess: onClose },
              )
            }
          >
            {createHomework.isPending && (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            )}
            {t("publish")}
          </button>
        </div>
      </div>
    </section>
  );
}

function Submissions({ homeworkId }: { homeworkId: number }) {
  const t = useTranslations("homeworks");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDateTime } = useDateFormat();
  const submissionsQuery = useHomeworkSubmissions(homeworkId);

  if (submissionsQuery.isPending) {
    return <DataState status="loading" />;
  }

  if (submissionsQuery.isError) {
    return (
      <DataState
        status="error"
        message={handleApiError(submissionsQuery.error, tApiErrors)}
        onRetry={() => submissionsQuery.refetch()}
      />
    );
  }

  if (submissionsQuery.data.length === 0) {
    return <p className={adminStyles.fieldHint}>{t("noSubmissions")}</p>;
  }

  return (
    <ul className={styles.submissions}>
      {submissionsQuery.data.map((submission) => (
        <li key={submission.id} className={styles.answer}>
          <strong>
            {submission.student_name} · {formatDateTime(submission.submitted_at)}
          </strong>
          {submission.text && <p>{submission.text}</p>}
          <AttachmentList images={[]} files={submission.file_urls} />
        </li>
      ))}
    </ul>
  );
}

// Учитель даёт задания по своим предметам и смотрит, кто что сдал.
export function TeacherHomeworks() {
  const t = useTranslations("homeworks");
  const tApiErrors = useTranslations("apiErrors");
  const homeworksQuery = useHomeworks(null, true);
  const deleteHomework = useDeleteHomework();
  const [isFormOpen, setIsFormOpen] = useState(false);
  useCreateIntent("homework", () => setIsFormOpen(true));
  const [openSubmissionsId, setOpenSubmissionsId] = useState<number | null>(null);
  const { hiddenIds, requestDelete } = useUndoableDelete(deleteHomework.mutateAsync, t("deleted"));
  const homeworks = (homeworksQuery.data ?? []).filter((homework) => !hiddenIds.has(homework.id));

  const renderList = () => {
    if (homeworksQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (homeworksQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(homeworksQuery.error, tApiErrors)}
          onRetry={() => homeworksQuery.refetch()}
        />
      );
    }

    if (homeworks.length === 0) {
      return <DataState status="empty" message={t("emptyTeacher")} action={{ label: t("add"), onClick: () => setIsFormOpen(true) }} />;
    }

    return (
      <div className={styles.list}>
        {homeworks.map((homework) => (
          <HomeworkCard key={homework.id} homework={homework}>
            <div className={styles.cardActions}>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() =>
                  setOpenSubmissionsId(openSubmissionsId === homework.id ? null : homework.id)
                }
              >
                <MessageSquareText size={16} aria-hidden="true" />
                {openSubmissionsId === homework.id ? t("hideSubmissions") : t("showSubmissions")}
              </button>
              <button
                type="button"
                className={cn(adminStyles.secondaryButton, adminStyles.ghostDanger)}
                onClick={() => {
                  setOpenSubmissionsId(null);
                  requestDelete(homework.id);
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t("delete")}
              </button>
            </div>
            {openSubmissionsId === homework.id && <Submissions homeworkId={homework.id} />}
          </HomeworkCard>
        ))}
      </div>
    );
  };

  return (
    <>
      {!isFormOpen && (
        <div className={styles.topActions}>
          <button type="button" className={adminStyles.primaryButton} onClick={() => setIsFormOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            {t("add")}
          </button>
        </div>
      )}
      {isFormOpen && <HomeworkForm onClose={() => setIsFormOpen(false)} />}
      <section className={adminStyles.card}>{renderList()}</section>
    </>
  );
}
