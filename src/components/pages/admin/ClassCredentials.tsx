"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, FileSpreadsheet, KeyRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadClassCredentials, type CredentialRow } from "@/apis/credentials.api";
import { DataState } from "@/components/ui/DataState";
import { useClassCredentials, useResetClassStudentPassword } from "@/hooks/useCredentials";
import { handleApiError } from "@/lib/errorHandler";
import { cn, downloadBlob } from "@/lib/utils";
import { SecretNotice } from "./SecretNotice";
import styles from "./admin.module.scss";
import peopleStyles from "./people.module.scss";

type ClassCredentialsProps = {
  classId: number;
  onClose?: () => void;
};

type SecretState = { message: string; secret: string };

// Логины и временные пароли учеников класса: раздать на собрании или вернуть доступ.
// Пароль виден, пока ученик его не сменил; после смены его можно только сбросить.
export function ClassCredentials({ classId, onClose }: ClassCredentialsProps) {
  const t = useTranslations("credentials");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const credentialsQuery = useClassCredentials(classId);
  const resetPassword = useResetClassStudentPassword(classId);
  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const [confirmRow, setConfirmRow] = useState<CredentialRow | null>(null);
  const [secret, setSecret] = useState<SecretState | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDownload = async () => {
    setActionError("");
    try {
      const className = credentialsQuery.data?.class_name ?? String(classId);
      downloadBlob(await downloadClassCredentials(classId), `${className}-logins.xlsx`);
    } catch (error) {
      setActionError(handleApiError(error, tApiErrors));
    }
  };

  const handleReset = (row: CredentialRow) => {
    setActionError("");
    resetPassword.mutate(row.id, {
      onSuccess: (result) => {
        setConfirmRow(null);
        setSecret({ message: t("resetNotice", { name: result.full_name }), secret: result.temporary_password });
      },
      onError: (error) => setActionError(handleApiError(error, tApiErrors)),
    });
  };

  const renderList = () => {
    if (credentialsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (credentialsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(credentialsQuery.error, tApiErrors)}
          onRetry={() => credentialsQuery.refetch()}
        />
      );
    }

    if (credentialsQuery.data.students.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ul className={peopleStyles.list}>
        {credentialsQuery.data.students.map((row) => (
          <li key={row.id} className={peopleStyles.person}>
            <span className={peopleStyles.avatar} aria-hidden="true">
              {row.full_name.charAt(0)}
            </span>
            <div className={peopleStyles.personInfo}>
              <strong>{row.full_name}</strong>
              <span className={peopleStyles.personMeta}>
                <span>
                  {t("login")}: {row.email}
                </span>
              </span>
              {row.is_temp_password ? (
                <span className={peopleStyles.tempPassword}>
                  {t("tempPassword")}:{" "}
                  <span className={peopleStyles.secret}>
                    {passwordsVisible ? (row.temporary_password ?? "—") : "••••••••••"}
                  </span>
                </span>
              ) : (
                <span className={cn(peopleStyles.personMeta, styles.statusOk)}>
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {t("passwordChanged")}
                </span>
              )}
            </div>
            <div className={peopleStyles.personActions}>
              <button type="button" className={styles.linkButton} onClick={() => setConfirmRow(row)}>
                {t("reset")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <KeyRound size={17} aria-hidden="true" />
          {t("title", { name: credentialsQuery.data?.class_name ?? "…" })}
        </h2>
        {onClose && (
          <button type="button" className={styles.iconButton} aria-label={tForm("close")} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className={styles.fieldHint}>{t("description")}</p>

      <div className={styles.toolbar}>
        <button type="button" className={styles.secondaryButton} onClick={() => setPasswordsVisible((value) => !value)}>
          {passwordsVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {passwordsVisible ? t("hidePasswords") : t("showPasswords")}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleDownload}>
          <FileSpreadsheet size={16} aria-hidden="true" />
          {t("download")}
        </button>
      </div>

      {actionError && (
        <p className={styles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {actionError}
        </p>
      )}

      {secret && <SecretNotice message={secret.message} secret={secret.secret} onClose={() => setSecret(null)} />}

      {confirmRow && (
        <div className={styles.inlineConfirm} role="alertdialog" aria-labelledby="credentials-confirm">
          <p id="credentials-confirm" className={styles.notice}>
            {t("confirmReset", { name: confirmRow.full_name })}
          </p>
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setConfirmRow(null)}>
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={resetPassword.isPending}
              onClick={() => handleReset(confirmRow)}
            >
              {t("reset")}
            </button>
          </div>
        </div>
      )}

      {renderList()}
    </section>
  );
}
