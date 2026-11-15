"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./admin.module.scss";

type SecretNoticeProps = {
  message: string;
  secret: string;
  onClose: () => void;
};

// Временный пароль, который backend показывает один раз: после создания аккаунта или сброса.
export function SecretNotice({ message, secret, onClose }: SecretNoticeProps) {
  const tForm = useTranslations("admin.form");
  const [copied, setCopied] = useState(false);

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      // Без доступа к буферу обмена пароль можно выделить вручную.
    }
  };

  return (
    <section className={styles.card} role="status">
      <p className={styles.notice}>
        <KeyRound size={16} aria-hidden="true" />
        <span>
          {message} <span className={styles.secret}>{secret}</span>
        </span>
      </p>
      <div className={styles.formActions}>
        <button type="button" className={styles.secondaryButton} onClick={copySecret}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? tForm("copied") : tForm("copy")}
        </button>
        <button type="button" className={styles.primaryButton} onClick={onClose}>
          {tForm("close")}
        </button>
      </div>
    </section>
  );
}
