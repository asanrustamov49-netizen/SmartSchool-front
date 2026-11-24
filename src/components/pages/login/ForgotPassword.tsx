"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestPasswordReset } from "@/hooks/useAuth";
import { Link } from "@/i18n/navigation";
import { getApiErrorStatus, handleApiError } from "@/lib/errorHandler";
import { AuthLayout } from "./AuthLayout";
import styles from "./login.module.scss";

type ForgotPasswordValues = {
  email: string;
};

// «Забыли пароль?»: письмо со ссылкой для нового пароля приходит на почту-логин.
const ForgotPassword = () => {
  const t = useTranslations("auth.forgot");
  const tAuth = useTranslations("auth");
  const tApiErrors = useTranslations("apiErrors");
  const requestReset = useRequestPasswordReset();

  const schema = z.object({
    email: z.string().trim().pipe(z.email(tAuth("errors.emailFormat"))),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const getErrorMessage = (error: Error) =>
    getApiErrorStatus(error) === 429 ? tAuth("errors.tooManyAttempts") : handleApiError(error, tApiErrors);

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")} showBackLink>
      {requestReset.isSuccess ? (
        <div className={styles.form}>
          <p className={styles.infoNote} role="status">
            <CircleCheck size={16} aria-hidden="true" />
            {t("sent")}
          </p>
          <p className={styles.switchAuth}>
            <Link href="/login">{t("backToLogin")}</Link>
          </p>
        </div>
      ) : (
        <form
          className={styles.form}
          noValidate
          onSubmit={handleSubmit((values) => requestReset.mutate(values.email.trim()))}
        >
          {requestReset.isError && (
            <p className={styles.formError} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              {getErrorMessage(requestReset.error)}
            </p>
          )}

          <div className={styles.field}>
            <Label htmlFor="forgot-email" className={styles.label}>
              {tAuth("email")}
            </Label>
            <div className={styles.inputWrap}>
              <Mail className={styles.inputIcon} size={18} aria-hidden="true" />
              <Input
                id="forgot-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                className={styles.input}
                placeholder={tAuth("emailPlaceholder")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "forgot-email-error" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="forgot-email-error" className={styles.fieldError}>
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className={styles.submitButton} disabled={requestReset.isPending}>
            {requestReset.isPending && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
            {t("submit")}
          </Button>

          <p className={styles.switchAuth}>
            <Link href="/login">{t("backToLogin")}</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
