"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Subject } from "@/apis/subjects.api";
import { Select } from "@/components/ui/Select";
import { useCreateSubject, useUpdateSubject } from "@/hooks/useSubjects";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { SUBJECT_CATALOG } from "@/lib/subjectName";
import styles from "./admin.module.scss";

type SubjectFormValues = {
  name: string;
};

type SubjectFormProps = {
  // null — новый предмет, иначе изменение существующего.
  subject: Subject | null;
  onClose: () => void;
};

export function SubjectForm({ subject, onClose }: SubjectFormProps) {
  const t = useTranslations("admin.subjects");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const activeMutation = subject ? updateSubject : createSubject;

  const subjectSchema = z.object({
    name: z.string().min(1, tForm("required")),
  });

  // Название — только из списка, чтобы нельзя было вписать что угодно. Backend проверяет то же.
  // Старое название не из списка остаётся в вариантах, чтобы предмет можно было открыть и сохранить.
  const catalogNames = SUBJECT_CATALOG.map((item) => (locale === "ky" ? item.ky : item.ru));
  const nameOptions = [...new Set([...(subject ? [subject.name] : []), ...catalogNames])].map((name) => ({
    value: name,
    label: name,
  }));

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: subject?.name ?? "" },
  });

  const onSubmit = (values: SubjectFormValues) => {
    const data = { name: values.name.trim() };
    const handleError = (error: unknown) => {
      const fieldErrors = getApiFieldErrors(error);

      if (fieldErrors.name) {
        setError("name", { message: fieldErrors.name });
      }
    };

    if (subject) {
      updateSubject.mutate(
        { subjectId: subject.id, data },
        { onSuccess: onClose, onError: handleError },
      );
      return;
    }

    createSubject.mutate(data, { onSuccess: onClose, onError: handleError });
  };

  const hasFieldErrors = Object.keys(getApiFieldErrors(activeMutation.error)).length > 0;
  const formError =
    activeMutation.isError && !hasFieldErrors
      ? handleApiError(activeMutation.error, tApiErrors)
      : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{subject ? t("editTitle") : t("createTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="subject-name">{t("name")}</label>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Select
                id="subject-name"
                value={field.value}
                onValueChange={field.onChange}
                options={nameOptions}
                placeholder={t("nameHint")}
                invalid={Boolean(errors.name)}
              />
            )}
          />
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={activeMutation.isPending}
          >
            {activeMutation.isPending && (
              <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
            )}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
