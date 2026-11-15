"use client";

import { CircleAlert, LoaderCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { JournalAssignment } from "@/apis/journal.api";
import type { ScheduleBells, ScheduleLesson } from "@/apis/schedule.api";
import { useDeleteScheduleLesson, useSaveScheduleLesson } from "@/hooks/useSchedule";
import { handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";

export type LessonDraft = {
  // null — новый урок.
  lesson: ScheduleLesson | null;
  weekday: number;
  lessonNumber: number;
};

type LessonFormProps = {
  draft: LessonDraft;
  // Назначения (предмет + учитель) выбранного класса.
  assignments: JournalAssignment[];
  bells: ScheduleBells;
  onClose: () => void;
};

export function LessonForm({ draft, assignments, bells, onClose }: LessonFormProps) {
  const t = useTranslations("schedule");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const saveLesson = useSaveScheduleLesson();
  const deleteLesson = useDeleteScheduleLesson();
  const [assignmentId, setAssignmentId] = useState(
    draft.lesson ? String(draft.lesson.assignment_id) : "",
  );
  const [weekday, setWeekday] = useState(String(draft.weekday));
  const [lessonNumber, setLessonNumber] = useState(String(draft.lessonNumber));
  const [room, setRoom] = useState(draft.lesson?.room ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (assignmentId === "") {
      return;
    }

    saveLesson.mutate(
      {
        lessonId: draft.lesson?.id ?? null,
        data: {
          assignment_id: Number(assignmentId),
          weekday: Number(weekday),
          lesson_number: Number(lessonNumber),
          room: emptyToNull(room),
        },
      },
      { onSuccess: onClose },
    );
  };

  const error = saveLesson.error ?? deleteLesson.error;

  return (
    <section className={adminStyles.card}>
      <h2 className={adminStyles.cardTitle}>{draft.lesson ? t("editTitle") : t("createTitle")}</h2>

      {error && (
        <p className={adminStyles.formError} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {handleApiError(error, tApiErrors)}
        </p>
      )}

      <div className={adminStyles.form}>
        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <label htmlFor="lesson-assignment">{t("assignment")}</label>
          <select
            id="lesson-assignment"
            className={adminStyles.select}
            value={assignmentId}
            onChange={(event) => setAssignmentId(event.target.value)}
          >
            <option value="">{tForm("choose")}</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.subject_name} · {assignment.teacher_name}
              </option>
            ))}
          </select>
          {assignments.length === 0 && (
            <span className={adminStyles.fieldHint}>{t("noAssignments")}</span>
          )}
        </div>

        <div className={adminStyles.field}>
          <label htmlFor="lesson-weekday">{t("weekday")}</label>
          <select
            id="lesson-weekday"
            className={adminStyles.select}
            value={weekday}
            onChange={(event) => setWeekday(event.target.value)}
          >
            {bells.weekdays.map((day) => (
              <option key={day.weekday} value={day.weekday}>
                {t(`weekdays.${day.weekday}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={adminStyles.field}>
          <label htmlFor="lesson-number">{t("lessonNumber")}</label>
          <select
            id="lesson-number"
            className={adminStyles.select}
            value={lessonNumber}
            onChange={(event) => setLessonNumber(event.target.value)}
          >
            {bells.bells.map((bell) => (
              <option key={bell.lesson_number} value={bell.lesson_number}>
                {t("lessonOption", {
                  number: bell.lesson_number,
                  start: bell.start_time,
                  end: bell.end_time,
                })}
              </option>
            ))}
          </select>
        </div>

        <div className={adminStyles.field}>
          <label htmlFor="lesson-room">{t("roomLabel")}</label>
          <input
            id="lesson-room"
            className={adminStyles.input}
            maxLength={50}
            placeholder={t("roomPlaceholder")}
            value={room}
            onChange={(event) => setRoom(event.target.value)}
          />
          <span className={adminStyles.fieldHint}>{tForm("optional")}</span>
        </div>

        <div className={adminStyles.formActions}>
          {draft.lesson && !confirmDelete && (
            <button
              type="button"
              className={adminStyles.dangerLink}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} aria-hidden="true" /> {t("delete")}
            </button>
          )}
          {draft.lesson && confirmDelete && (
            <button
              type="button"
              className={`${adminStyles.primaryButton} ${adminStyles.dangerButton}`}
              disabled={deleteLesson.isPending}
              onClick={() => {
                if (draft.lesson) {
                  deleteLesson.mutate(draft.lesson.id, { onSuccess: onClose });
                }
              }}
            >
              {t("confirmDelete")}
            </button>
          )}
          <button type="button" className={adminStyles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button
            type="button"
            className={adminStyles.primaryButton}
            disabled={assignmentId === "" || saveLesson.isPending}
            onClick={handleSave}
          >
            {saveLesson.isPending && (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            )}
            {tForm("save")}
          </button>
        </div>
      </div>
    </section>
  );
}
