"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { getClassName, type SchoolClass } from "@/apis/classes.api";
import type { Student, StudentCreated } from "@/apis/students.api";
import { Select } from "@/components/ui/Select";
import { useCreateStudent, useUpdateStudent } from "@/hooks/useStudents";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import { textRule, validatePersonName } from "@/lib/textChecks";
import styles from "./admin.module.scss";

type StudentFormValues = {
  inn: string;
  full_name: string;
  phone: string;
  class_id: string;
};

type StudentFormProps = {
  student: Student | null;
  classes: SchoolClass[];
  onCreated: (createdStudent: StudentCreated) => void;
  onClose: () => void;
};

// Backend разрешает менять у ученика только ФИО и телефон (StudentUpdate):
// ИНН и класс после создания не редактируются.
export function StudentForm({ student, classes, onCreated, onClose }: StudentFormProps) {
  const t = useTranslations("admin.students");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const mutation = student ? updateStudent : createStudent;
  const isEditing = student !== null;

  // Правила из StudentCreate/StudentUpdate: ИНН — 14 цифр, ФИО 3–200, телефон до 20 символов.
  // При редактировании ИНН и класс не показываются в полях формы и не отправляются.
  const studentSchema = z.object({
    inn: isEditing
      ? z.string()
      : z.string().trim().regex(/^\d{14}$/, tForm("innFormat")),
    full_name: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 }))
      .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
    phone: z.string().trim().max(20, tForm("maxLength", { count: 20 })),
    class_id: isEditing ? z.string() : z.string().min(1, tForm("required")),
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      inn: student?.inn ?? "",
      full_name: student?.full_name ?? "",
      phone: student?.phone ?? "",
      class_id: student?.class_id ? String(student.class_id) : "",
    },
  });

  const handleError = (error: Error) => {
    const fieldErrors = getApiFieldErrors(error);

    if (fieldErrors.inn) {
      setError("inn", { message: fieldErrors.inn });
    }

    if (fieldErrors.full_name) {
      setError("full_name", { message: fieldErrors.full_name });
    }

    if (fieldErrors.phone) {
      setError("phone", { message: fieldErrors.phone });
    }

    if (fieldErrors.class_id) {
      setError("class_id", { message: fieldErrors.class_id });
    }
  };

  const onSubmit = (values: StudentFormValues) => {
    const fullName = values.full_name.trim();
    const phone = emptyToNull(values.phone);

    if (student) {
      updateStudent.mutate(
        { studentId: student.id, data: { full_name: fullName, phone } },
        { onSuccess: onClose, onError: handleError },
      );
      return;
    }

    createStudent.mutate(
      {
        inn: values.inn.trim(),
        full_name: fullName,
        phone,
        class_id: Number(values.class_id),
      },
      { onSuccess: onCreated, onError: handleError },
    );
  };

  const studentClass = classes.find((schoolClass) => schoolClass.id === student?.class_id);
  const hasFieldErrors = Object.keys(getApiFieldErrors(mutation.error)).length > 0;
  const formError =
    mutation.isError && !hasFieldErrors ? handleApiError(mutation.error, tApiErrors) : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{isEditing ? t("editTitle") : t("createTitle")}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="student-name">{t("fullName")}</label>
          <input
            id="student-name"
            className={styles.input}
            autoComplete="off"
            aria-invalid={Boolean(errors.full_name)}
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className={styles.fieldError}>{errors.full_name.message}</p>
          )}
        </div>

        {student ? (
          <>
            <div className={styles.field}>
              <label htmlFor="student-inn">{t("inn")}</label>
              <input id="student-inn" className={styles.input} value={student.inn} readOnly disabled />
              <span className={styles.fieldHint}>{t("innReadonly")}</span>
            </div>

            <div className={styles.field}>
              <label htmlFor="student-class">{t("class")}</label>
              <input
                id="student-class"
                className={styles.input}
                value={studentClass ? getClassName(studentClass) : t("noClass")}
                readOnly
                disabled
              />
              <span className={styles.fieldHint}>{t("classReadonly")}</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.field}>
              <label htmlFor="student-inn">{t("inn")}</label>
              <input
                id="student-inn"
                className={styles.input}
                inputMode="numeric"
                maxLength={14}
                autoComplete="off"
                aria-invalid={Boolean(errors.inn)}
                {...register("inn")}
              />
              {errors.inn && <p className={styles.fieldError}>{errors.inn.message}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="student-class">{t("class")}</label>
              <Controller
                control={control}
                name="class_id"
                render={({ field }) => (
                  <Select
                    id="student-class"
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={Boolean(errors.class_id)}
                    placeholder={tForm("choose")}
                    options={classes.map((schoolClass) => ({
                      value: String(schoolClass.id),
                      label: `${getClassName(schoolClass)} · ${schoolClass.academic_year}`,
                    }))}
                  />
                )}
              />
              {errors.class_id && (
                <p className={styles.fieldError}>{errors.class_id.message}</p>
              )}
            </div>
          </>
        )}

        <div className={styles.field}>
          <label htmlFor="student-phone">{t("phone")}</label>
          <input
            id="student-phone"
            className={styles.input}
            type="tel"
            autoComplete="off"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          <span className={styles.fieldHint}>{tForm("optional")}</span>
          {errors.phone && <p className={styles.fieldError}>{errors.phone.message}</p>}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={mutation.isPending}>
            {mutation.isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
            {tForm("save")}
          </button>
        </div>
      </form>
    </section>
  );
}
