"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SchoolAdminFields, SchoolAdminRole } from "@/apis/system.api";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { emptyToNull } from "@/lib/utils";
import styles from "./admin.module.scss";

type AdminAccountFormValues = {
  inn: string;
  fullName: string;
  phone: string;
  role: SchoolAdminRole;
};

type AdminAccountFormProps = {
  title: string;
  // Выбор роли нужен системному администратору; директор добавляет только завучей.
  withRole: boolean;
  isPending: boolean;
  error: unknown;
  onSubmit: (data: SchoolAdminFields & { role: SchoolAdminRole }) => void;
  onClose: () => void;
};

// Новый директор или завуч: схема SchoolAdminCreate (ИНН 14 цифр, ФИО 3–200 символов).
export function AdminAccountForm({ title, withRole, isPending, error, onSubmit, onClose }: AdminAccountFormProps) {
  const t = useTranslations("people");
  const tRole = useTranslations("app.role");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");

  const accountSchema = z.object({
    inn: z.string().trim().regex(/^\d{14}$/, tForm("innFormat")),
    fullName: z
      .string()
      .trim()
      .min(3, tForm("minLength", { count: 3 }))
      .max(200, tForm("maxLength", { count: 200 })),
    phone: z.string().trim().max(20, tForm("maxLength", { count: 20 })),
    role: z.enum(["DIRECTOR", "DEPUTY"]),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminAccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { inn: "", fullName: "", phone: "", role: "DEPUTY" },
  });

  const fieldErrors = getApiFieldErrors(error);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    if (fieldErrors.inn) {
      setError("inn", { message: fieldErrors.inn });
    }
    if (fieldErrors.full_name) {
      setError("fullName", { message: fieldErrors.full_name });
    }
  }, [fieldErrors.inn, fieldErrors.full_name, setError]);

  const formError = error && !hasFieldErrors ? handleApiError(error, tApiErrors) : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit((values) =>
          onSubmit({
            inn: values.inn.trim(),
            full_name: values.fullName.trim(),
            phone: emptyToNull(values.phone),
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

        {withRole && (
          <div className={styles.field}>
            <label htmlFor="account-role">{t("role")}</label>
            <select id="account-role" className={styles.select} {...register("role")}>
              <option value="DEPUTY">{tRole("DEPUTY")}</option>
              <option value="DIRECTOR">{tRole("DIRECTOR")}</option>
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="account-inn">{t("inn")}</label>
          <input
            id="account-inn"
            inputMode="numeric"
            maxLength={14}
            className={styles.input}
            aria-invalid={Boolean(errors.inn)}
            {...register("inn")}
          />
          {errors.inn && <p className={styles.fieldError}>{errors.inn.message}</p>}
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

        <div className={styles.field}>
          <label htmlFor="account-phone">{t("phone")}</label>
          <input id="account-phone" type="tel" className={styles.input} {...register("phone")} />
          {errors.phone ? (
            <p className={styles.fieldError}>{errors.phone.message}</p>
          ) : (
            <span className={styles.fieldHint}>{tForm("optional")}</span>
          )}
        </div>

        <p className={styles.notice}>{t("tempPasswordNote")}</p>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {tForm("cancel")}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isPending}>
            {isPending && <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />}
            {t("create")}
          </button>
        </div>
      </form>
    </section>
  );
}
