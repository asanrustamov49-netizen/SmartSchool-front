"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ParentChild } from "@/apis/auth.api";
import { Select } from "@/components/ui/Select";
import { useAbsenceRules, useCreateAbsenceRequest } from "@/hooks/useAbsenceRequests";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import { textRule, validateFreeText } from "@/lib/textChecks";
import adminStyles from "../admin/admin.module.scss";

type AbsenceFormValues = {
  studentId: string;
  targetDate: string;
  reason: string;
  comment: string;
};

type AbsenceFormProps = {
  childrenList: ParentChild[];
  onClose: () => void;
};

function toDateString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function AbsenceForm({ childrenList, onClose }: AbsenceFormProps) {
  const t = useTranslations("absence");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const rulesQuery = useAbsenceRules(true);
  const createRequest = useCreateAbsenceRequest();

  // Окно подачи задаёт backend: на сегодня — только до 08:00, вперёд — не больше max_days_ahead.
  const today = new Date();
  const rules = rulesQuery.data;
  const minDate = toDateString(rules && !rules.is_open_for_today ? addDays(today, 1) : today);
  const maxDate = toDateString(addDays(today, rules?.max_days_ahead ?? 14));

  const absenceSchema = z.object({
    studentId: z.string().min(1, tForm("required")),
    targetDate: z
      .string()
      .min(1, tForm("required"))
      .refine((value) => value >= minDate && value <= maxDate, t("dateOutOfRange")),
    reason: z
      .string()
      .trim()
      .min(2, tForm("minLength", { count: 2 }))
      .max(100, tForm("maxLength", { count: 100 }))
      .superRefine(textRule(validateFreeText, (problem) => tChecks(problem))),
    comment: z
      .string()
      .max(1000, tForm("maxLength", { count: 1000 }))
      .superRefine(textRule(validateFreeText, (problem) => tChecks(problem))),
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      studentId: childrenList.length === 1 ? String(childrenList[0].id) : "",
      targetDate: "",
      reason: "",
      comment: "",
    },
  });

  const onSubmit = (values: AbsenceFormValues) => {
    createRequest.mutate(
      {
        student_id: Number(values.studentId),
        target_date: values.targetDate,
        reason: values.reason.trim(),
        comment: emptyToNull(values.comment),
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.reason) {
            setError("reason", { message: fieldErrors.reason });
          }
        },
      },
    );
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(createRequest.error)).length > 0;
  const formError =
    createRequest.isError && !hasFieldErrors ? handleApiError(createRequest.error, tApiErrors) : null;

  return (
    <section className={adminStyles.card}>
      <h2 className={adminStyles.cardTitle}>{t("createTitle")}</h2>
      {rules && (
        <p className={adminStyles.notice}>
          {t("rules", { deadline: rules.deadline, days: rules.max_days_ahead })}
        </p>
      )}
      <form className={adminStyles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={adminStyles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={adminStyles.field}>
          <label htmlFor="absence-child">{t("child")}</label>
          <Controller
            control={control}
            name="studentId"
            render={({ field }) => (
              <Select
                id="absence-child"
                value={field.value}
                onValueChange={field.onChange}
                invalid={Boolean(errors.studentId)}
                placeholder={tForm("choose")}
                options={childrenList.map((child) => ({
                  value: String(child.id),
                  label: child.class_name ? `${child.full_name} · ${child.class_name}` : child.full_name,
                }))}
              />
            )}
          />
          {errors.studentId && <p className={adminStyles.fieldError}>{errors.studentId.message}</p>}
        </div>

        <div className={adminStyles.field}>
          <label htmlFor="absence-date">{t("targetDate")}</label>
          <input
            id="absence-date"
            type="date"
            min={minDate}
            max={maxDate}
            className={adminStyles.input}
            aria-invalid={Boolean(errors.targetDate)}
            {...register("targetDate")}
          />
          {errors.targetDate && <p className={adminStyles.fieldError}>{errors.targetDate.message}</p>}
        </div>

        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <label htmlFor="absence-reason">{t("reason")}</label>
          <input
            id="absence-reason"
            className={adminStyles.input}
            maxLength={100}
            placeholder={t("reasonPlaceholder")}
            aria-invalid={Boolean(errors.reason)}
            {...register("reason")}
          />
          {errors.reason && <p className={adminStyles.fieldError}>{errors.reason.message}</p>}
        </div>

        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}>
          <label htmlFor="absence-comment">{t("commentLabel")}</label>
          <textarea
            id="absence-comment"
            rows={3}
            maxLength={1000}
            className={`${adminStyles.input} ${adminStyles.textarea}`}
            {...register("comment")}
          />
          <span className={adminStyles.fieldHint}>{tForm("optional")}</span>
        </div>

        <div className={adminStyles.formActions}>
          <button type="button" className={adminStyles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={adminStyles.primaryButton} disabled={createRequest.isPending}>
            {createRequest.isPending && (
              <LoaderCircle className={adminStyles.spinner} size={16} aria-hidden="true" />
            )}
            {t("submit")}
          </button>
        </div>
      </form>
    </section>
  );
}
