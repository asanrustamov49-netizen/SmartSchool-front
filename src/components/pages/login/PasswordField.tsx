"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./login.module.scss";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password" | "off";
  error: string | undefined;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  hint?: string;
};

// Поле пароля с кнопкой «показать / скрыть» для форм входа, смены пароля и регистрации.
export function PasswordField({
  id,
  label,
  autoComplete,
  error,
  registration,
  placeholder,
  hint,
}: PasswordFieldProps) {
  const tAuth = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={styles.field}>
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <div className={styles.passwordWrap}>
        <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
        <Input
          id={id}
          className={styles.input}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...registration}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={visible ? tAuth("hidePassword") : tAuth("showPassword")}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={styles.fieldHint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
