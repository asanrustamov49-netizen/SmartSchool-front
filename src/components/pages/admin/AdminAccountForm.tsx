"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { SchoolAdmin, SchoolAdminFields, SchoolAdminRole } from "@/apis/system.api";
import { Select } from "@/components/ui/Select";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validatePersonName } from "@/lib/textChecks";
import styles from "./admin.module.scss";

type AdminAccountFormValues = {
  email: string;
  fullName: string;
  role: SchoolAdminRole;
};

type AdminAccountFormProps = {
  title: string;
  // Роли, которые сейчас можно добавить (с учётом лимитов школы). Если роль одна — выбора нет.
  allowedRoles: SchoolAdminRole[];
  isPending: boolean;
  error: unknown;
  onSubmit: (data: SchoolAdminFields & { role: SchoolAdminRole }) => void;
  onClose: () => void;
  // Изменение существующего руководителя: ФИО и почта, без выбора роли.
  person?: SchoolAdmin;
};

// Новый директор или завуч: схема SchoolAdminCreate (почта, ФИО 3–200 символов).
// С person — изменение ФИО и почты (схема SchoolAdminUpdate).
export function AdminAccountForm({
  title,
  allowedRoles,
  isPending,
  error,
  onSubmit,
  onClose,
  person,
}: AdminAccountFormProps) {
  const isEditing = person !== undefined;
  const t = useTranslations("people");
  const tRole = useTranslations("app.role");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");

  const accountSchema = z.object({
    email: z.string().trim().pipe(z.email(tForm("emailFormat"))),
    fullName: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 }))
      .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
    role: z.enum(["DIRECTOR", "DEPUTY"]).refine((role) => isEditing || allowedRoles.includes(role)),
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminAccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: person?.email ?? "",
      fullName: person?.full_name ?? "",
      role: person?.role ?? allowedRoles[0] ?? "DEPUTY",
    },
  });

  const fieldErrors = getApiFieldErrors(error);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    if (fieldErrors.email) {
      setError("email", { message: fieldErrors.email });
    }
    if (fieldErrors.full_name) {
      setError("fullName", { message: fieldErrors.full_name });
    }
  }, [fieldErrors.email, fieldErrors.full_name, setError]);

  const formError = error && !hasFieldErrors ? handleApiError(error, tApiErrors) : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit((values) =>
          onSubmit({
            email: values.email.trim(),
            full_name: values.fullName.trim(),
            role: values.role,
          }),
        )}
      >
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        {!isEditing && allowedRoles.length > 1 && (
          <div className={styles.field}>
            <label htmlFor="account-role">{t("role")}</label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  id="account-role"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={allowedRoles.map((role) => ({ value: role, label: tRole(role) }))}
                />
              )}
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="account-email">{t("email")}</label>
          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder={tForm("emailPlaceholder")}
            className={styles.input}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {isEditing && !errors.email && <span className={styles.fieldHint}>{tForm("emailChangeHint")}</span>}
          {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="account-name">{t("fullName")}</label>
          <input
            id="account-name"
            className={styles.input}
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName && <p className={styles.fieldError}>{errors.fullName.message}</p>}
        </div>

        {!isEditing && <p className={styles.notice}>{t("tempPasswordNote")}</p>}

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isPending}>
            {isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
            {isEditing ? tForm("save") : t("create")}
          </button>
        </div>
      </form>
    </section>
  );
}
