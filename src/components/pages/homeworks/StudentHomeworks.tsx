"use client";

import { CircleAlert, LoaderCircle, Paperclip, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { MAX_HOMEWORK_FILES, type Homework } from "@/apis/homeworks.api";
import { ChildTabs } from "@/components/ui/ChildTabs";
import { DataState } from "@/components/ui/DataState";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useHomeworks, useSubmitHomework } from "@/hooks/useHomeworks";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { AttachmentList, HomeworkCard, getHomeworkStatus } from "./HomeworkCard";
import adminStyles from "../admin/admin.module.scss";
import styles from "./homeworks.module.scss";

type Filter = "all" | "todo" | "submitted";

function SubmitForm({ homework, onDone }: { homework: Homework; onDone: () => void }) {
  const t = useTranslations("homeworks");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const submitHomework = useSubmitHomework();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const isEmpty = text.trim() === "" && files.length === 0;

  return (
    <div className={styles.submitForm}>
      <textarea
        className={`${adminStyles.input} ${adminStyles.textarea}`}
        rows={3}
        placeholder={t("answerPlaceholder")}
        aria-label={t("answerPlaceholder")}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className={styles.submitRow}>
        <label className={adminStyles.fileLabel}>
          <Paperclip size={16} aria-hidden="true" />
          {files.length > 0 ? t("filesChosen", { count: files.length }) : t("attachFiles")}
          <input
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_HOMEWORK_FILES))}
          />
        </label>
        <span className={adminStyles.fieldHint}>{t("filesHint", { count: MAX_HOMEWORK_FILES })}</span>
      </div>

      {submitHomework.isError && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(submitHomework.error, tApiErrors)}
        </p>
      )}

      <div className={adminStyles.formActions}>
        <button type="button" className={adminStyles.secondaryButton} onClick={onDone}>
          {tForm("cancel")}
        </button>
        <button
          type="button"
          className={adminStyles.primaryButton}
          disabled={isEmpty || submitHomework.isPending}
          onClick={() =>
            submitHomework.mutate({ homeworkId: homework.id, text, files }, { onSuccess: onDone })
          }
        >
          {submitHomework.isPending ? (
            <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {homework.is_submitted ? t("addToAnswer") : t("submit")}
        </button>
      </div>
    </div>
  );
}

// Ученик сдаёт задания, родитель видит задания и сданные ответы ребёнка.
export function StudentHomeworks({ user }: { user: CurrentUser }) {
  const t = useTranslations("homeworks");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDateTime } = useDateFormat();
  const isParent = user.role === "PARENT";
  const children = user.children ?? [];
  const [childId, setChildId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openFormId, setOpenFormId] = useState<number | null>(null);
  const studentId = isParent ? (childId ?? children[0]?.id ?? null) : null;
  const homeworksQuery = useHomeworks(studentId, !isParent || studentId !== null);

  if (isParent && children.length === 0) {
    return <DataState status="empty" message={t("noChildren")} />;
  }

  const homeworks = homeworksQuery.data ?? [];
  const todoCount = homeworks.filter((homework) => !homework.is_submitted).length;
  const visible = homeworks.filter((homework) => {
    if (filter === "todo") {
      return !homework.is_submitted;
    }
    if (filter === "submitted") {
      return homework.is_submitted;
    }
    return true;
  });

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

    if (visible.length === 0) {
      return <DataState status="empty" message={filter === "all" ? t("empty") : t("emptyFiltered")} />;
    }

    return (
      <div className={styles.list}>
        {visible.map((homework) => (
          <HomeworkCard key={homework.id} homework={homework} status={getHomeworkStatus(homework)}>
            {homework.submission && (
              <div className={styles.answer}>
                <strong>
                  {isParent ? t("childAnswer") : t("yourAnswer")} ·{" "}
                  {formatDateTime(homework.submission.submitted_at)}
                </strong>
                {homework.submission.text && <p>{homework.submission.text}</p>}
                <AttachmentList images={[]} files={homework.submission.file_urls} />
              </div>
            )}

            {!isParent &&
              (openFormId === homework.id ? (
                <SubmitForm homework={homework} onDone={() => setOpenFormId(null)} />
              ) : (
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={homework.is_submitted ? adminStyles.secondaryButton : adminStyles.primaryButton}
                    onClick={() => setOpenFormId(homework.id)}
                  >
                    <Send size={16} aria-hidden="true" />
                    {homework.is_submitted ? t("addToAnswer") : t("submit")}
                  </button>
                </div>
              ))}
          </HomeworkCard>
        ))}
      </div>
    );
  };

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t("filters.all", { count: homeworks.length }) },
    { value: "todo", label: t("filters.todo", { count: todoCount }) },
    { value: "submitted", label: t("filters.submitted", { count: homeworks.length - todoCount }) },
  ];

  return (
    <>
      {isParent && (
        <ChildTabs childrenList={children} selectedId={studentId} onSelect={setChildId} label={t("child")} />
      )}
      <section className={adminStyles.card}>
        <div className={styles.filters} role="tablist" aria-label={t("filterLabel")}>
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              className={cn(styles.filter, filter === item.value && styles.filterActive)}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {renderList()}
      </section>
    </>
  );
}
