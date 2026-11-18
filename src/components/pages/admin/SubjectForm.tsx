"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Subject } from "@/apis/subjects.api";
import { useCreateSubject, useUpdateSubject } from "@/hooks/useSubjects";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { SUBJECT_CATALOG } from "@/lib/subjectName";
import { emptyToNull } from "@/lib/utils";
import { textRule, validateSubjectName } from "@/lib/textChecks";
import styles from "./admin.module.scss";

type SubjectFormValues = {
  name: string;
  code: string;
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
  const tChecks = useTranslations("textChecks");
  const locale = useLocale();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const activeMutation = subject ? updateSubject : createSubject;

  // Правила из схемы SubjectCreate: name — от 2 до 100 символов и проходит проверку на допустимость.
  const subjectSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, tForm("minLength", { count: 2 }))
      .max(100, tForm("maxLength", { count: 100 }))
      .superRefine(textRule(validateSubjectName, (problem) => tChecks(problem))),
    code: z.string(),
  });

  // Сначала названия на языке интерфейса, затем на втором языке — школа может вести предмет на любом.
  const otherLocale = locale === "ky" ? "ru" : "ky";
  const suggestions = [
    ...new Set([
      ...SUBJECT_CATALOG.map((item) => (locale === "ky" ? item.ky : item.ru)),
      ...SUBJECT_CATALOG.map((item) => item[otherLocale]),
    ]),
  ];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: subject?.name ?? "", code: subject?.code ?? "" },
  });

  const onSubmit = (values: SubjectFormValues) => {
    const data = { name: values.name.trim(), code: emptyToNull(values.code) };
    const handleError = (error: unknown) => {
      const fieldErrors = getApiFieldErrors(error);

      if (fieldErrors.name) {
        setError("name", { message: fieldErrors.name });
      }

      if (fieldErrors.code) {
        setError("code", { message: fieldErrors.code });
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
          <input
            id="subject-name"
            className={styles.input}
            list="subject-name-suggestions"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            aria-describedby="subject-name-hint"
            {...register("name")}
          />
          <datalist id="subject-name-suggestions">
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <span id="subject-name-hint" className={styles.fieldHint}>{t("nameHint")}</span>
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="subject-code">{t("code")}</label>
          <input
            id="subject-code"
            className={styles.input}
            aria-invalid={Boolean(errors.code)}
            {...register("code")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
          {errors.code && <p className={styles.fieldError}>{errors.code.message}</p>}
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
