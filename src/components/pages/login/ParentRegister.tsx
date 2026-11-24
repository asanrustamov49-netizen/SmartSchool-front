"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  CircleAlert,
  Info,
  KeyRound,
  LoaderCircle,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { getParentLinkErrorKey, isParentCode, normalizeParentCode } from "@/apis/parents.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterParent } from "@/hooks/useParents";
import { Link, useRouter } from "@/i18n/navigation";
import { getApiFieldErrors, handleApiError } from "@/lib/errorHandler";
import { textRule, validatePersonName } from "@/lib/textChecks";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import styles from "./login.module.scss";

type ParentRegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  studentCode: string;
};

type TextFieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  error: string | undefined;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  type?: "email" | "text";
  inputMode?: "email" | "text";
  autoComplete?: string;
};

function TextField({ id, label, icon: Icon, error, registration, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <div className={styles.inputWrap}>
        <Icon className={styles.inputIcon} size={18} aria-hidden="true" />
        <Input
          id={id}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          {...registration}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

// Поля формы → поля схемы ParentRegister, чтобы показать ошибки 422 у нужного поля.
const apiFieldNames: Record<string, keyof ParentRegisterFormValues> = {
  full_name: "fullName",
  email: "email",
  password: "password",
  student_code: "studentCode",
};

const ParentRegister = () => {
  const t = useTranslations("parentLink");
  const tAuth = useTranslations("auth");
  const tApiErrors = useTranslations("apiErrors");
  const tChecks = useTranslations("textChecks");
  const router = useRouter();
  const registerMutation = useRegisterParent();

  // Правила совпадают со схемой ParentRegister: логин — почта, пароль — от 8 символов.
  const emailRule = z.string().trim().pipe(z.email(tAuth("errors.emailFormat")));
  const registerSchema = z
    .object({
      fullName: z
        .string()
        .trim()
        .min(3, t("errors.fullNameMin"))
        .superRefine(textRule(validatePersonName, (problem) => tChecks(problem))),
      email: emailRule,
      password: z.string().min(8, t("errors.passwordMin")),
      studentCode: z.string().refine(isParentCode, t("errors.codeFormat")),
    });

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    formState: { errors },
  } = useForm<ParentRegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      studentCode: "",
    },
  });

  // Два коротких шага: сначала ребёнок (данные выдала школа), потом сам родитель.
  const [step, setStep] = useState<1 | 2>(1);

  const goToParentStep = async () => {
    if (await trigger(["studentCode"])) {
      setStep(2);
    }
  };

  const onSubmit = (values: ParentRegisterFormValues) => {
    registerMutation.mutate(
      {
        full_name: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        student_code: normalizeParentCode(values.studentCode),
      },
      {
        onSuccess: () => router.replace("/"),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          // Ошибка про данные ребёнка — возвращаем на первый шаг, где эти поля.
          const errorKey = getParentLinkErrorKey(error);
          if ((errorKey && errorKey !== "emailTaken") || fieldErrors.student_code) {
            setStep(1);
          }

          for (const [apiField, message] of Object.entries(fieldErrors)) {
            const formField = apiFieldNames[apiField];
            if (formField) {
              setError(formField, { message });
            }
          }
        },
      },
    );
  };

  const getFormError = (error: Error) => {
    const errorKey = getParentLinkErrorKey(error);
    return errorKey ? t(`errors.${errorKey}`) : handleApiError(error, tApiErrors);
  };

  const isSubmitting = registerMutation.isPending || registerMutation.isSuccess;
  const hasFieldErrors = Object.keys(getApiFieldErrors(registerMutation.error)).length > 0;
  const formError =
    registerMutation.isError && !hasFieldErrors ? getFormError(registerMutation.error) : null;

  return (
    <AuthLayout title={t("registerTitle")} subtitle={t("registerSubtitle")} showBackLink>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {formError}
          </p>
        )}

        <p className={styles.stepCounter}>{t("step", { step })}</p>

        {step === 1 ? (
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              <Baby size={17} aria-hidden="true" />
              {t("childSection")}
            </legend>
            <p className={styles.infoNote}>
              <Info size={16} aria-hidden="true" />
              {t("childNote")}
            </p>
            <TextField
              id="child-code"
              label={t("childCode")}
              icon={KeyRound}
              autoComplete="off"
              placeholder={t("childCodePlaceholder")}
              error={errors.studentCode?.message}
              registration={register("studentCode")}
            />
            <Button type="button" className={styles.submitButton} onClick={goToParentStep}>
              {t("next")}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </fieldset>
        ) : (
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              <UserRound size={17} aria-hidden="true" />
              {t("parentSection")}
            </legend>
            <TextField
              id="parent-full-name"
              label={t("fullName")}
              icon={UserRound}
              autoComplete="name"
              placeholder={t("fullNamePlaceholder")}
              error={errors.fullName?.message}
              registration={register("fullName")}
            />
            <TextField
              id="parent-email"
              label={t("parentEmail")}
              icon={Mail}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={tAuth("emailPlaceholder")}
              error={errors.email?.message}
              registration={register("email")}
            />
            <PasswordField
              id="parent-password"
              label={t("password")}
              autoComplete="new-password"
              hint={t("passwordHint")}
              error={errors.password?.message}
              registration={register("password")}
            />
            <div className={styles.stepActions}>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft size={18} aria-hidden="true" />
                {t("back")}
              </Button>
              <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
                {isSubmitting ? t("registering") : t("register")}
              </Button>
            </div>
          </fieldset>
        )}

        <p className={styles.switchAuth}>
          {t("haveAccount")}
          <Link href="/login">{tAuth("login")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ParentRegister;
