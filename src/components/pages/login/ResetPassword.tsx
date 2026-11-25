"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/hooks/useAuth";
import { Link } from "@/i18n/navigation";
import { getApiErrorStatus, handleApiError } from "@/lib/errorHandler";
import { isStrongPassword } from "@/lib/textChecks";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import styles from "./login.module.scss";

type ResetPasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

// Новый пароль по ссылке из письма (?token=...). Ссылка действует 30 минут и один раз.
const ResetPassword = () => {
  const t = useTranslations("auth.reset");
  const tFirst = useTranslations("auth.firstLogin");
  const tAuth = useTranslations("auth");
  const tApiErrors = useTranslations("apiErrors");
  const token = useSearchParams().get("token") ?? "";
  const resetPassword = useResetPassword();

  const schema = z
    .object({
      newPassword: z.string().min(8, tFirst("errors.newPasswordMin")).refine(isStrongPassword, tAuth("errors.weakPassword")),
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: tFirst("errors.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // 400 — ссылка устарела или уже использована.
  const getErrorMessage = (error: Error) =>
    getApiErrorStatus(error) === 400 ? t("invalidLink") : handleApiError(error, tApiErrors);

  const renderContent = () => {
    if (!token) {
      return (
        <div className={styles.form}>
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {t("invalidLink")}
          </p>
          <p className={styles.switchAuth}>
            <Link href="/forgot-password">{t("requestAgain")}</Link>
          </p>
        </div>
      );
    }

    if (resetPassword.isSuccess) {
      return (
        <div className={styles.form}>
          <p className={styles.infoNote} role="status">
            <CircleCheck size={16} aria-hidden="true" />
            {t("done")}
          </p>
          <p className={styles.switchAuth}>
            <Link href="/login">{t("goToLogin")}</Link>
          </p>
        </div>
      );
    }

    return (
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit((values) => resetPassword.mutate({ token, new_password: values.newPassword }))}
      >
        {resetPassword.isError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {getErrorMessage(resetPassword.error)}
          </p>
        )}
        <PasswordField
          id="reset-new-password"
          label={tFirst("newPassword")}
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register("newPassword")}
        />
        <PasswordField
          id="reset-confirm-password"
          label={tFirst("confirmPassword")}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />
        <Button type="submit" className={styles.submitButton} disabled={resetPassword.isPending}>
          {resetPassword.isPending && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
          {t("submit")}
        </Button>
      </form>
    );
  };

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")} showBackLink>
      {renderContent()}
    </AuthLayout>
  );
};

export default ResetPassword;
