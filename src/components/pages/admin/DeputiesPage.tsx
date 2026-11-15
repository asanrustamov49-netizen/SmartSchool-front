"use client";

import { AlertCircle, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getAdminLimits, MAX_DEPUTIES, type SchoolAdmin } from "@/apis/system.api";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useCreateDeputy,
  useDeactivateDeputy,
  useDeputies,
  useResetDeputyPassword,
} from "@/hooks/useDeputies";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { AdminAccountForm } from "./AdminAccountForm";
import { AdminPersonCard } from "./AdminPersonCard";
import { SecretNotice } from "./SecretNotice";
import styles from "./admin.module.scss";
import peopleStyles from "./people.module.scss";

type Panel =
  | { type: "none" }
  | { type: "form" }
  | { type: "confirm"; action: "reset" | "deactivate"; person: SchoolAdmin };

type SecretState = { message: string; secret: string };

// Завучи школы. Добавляет, отключает и сбрасывает пароль только директор (backend: /admin/deputies).
// Вернуть отключённого завуча может системный администратор платформы.
export function DeputiesPage() {
  const t = useTranslations("people");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const isDirector = useCurrentUser().data?.role === "DIRECTOR";
  const deputiesQuery = useDeputies();
  const createDeputy = useCreateDeputy();
  const deactivateDeputy = useDeactivateDeputy();
  const resetPassword = useResetDeputyPassword();
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [secret, setSecret] = useState<SecretState | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const limits = getAdminLimits(deputiesQuery.data ?? []);

  const openPanel = (nextPanel: Panel) => {
    setSecret(null);
    setStatusMessage("");
    setActionError("");
    createDeputy.reset();
    setPanel(nextPanel);
  };

  const handleConfirm = () => {
    if (panel.type !== "confirm") {
      return;
    }
    const { person } = panel;
    const onError = (error: unknown) => setActionError(handleApiError(error, tApiErrors));

    if (panel.action === "deactivate") {
      deactivateDeputy.mutate(person.id, {
        onSuccess: () => {
          setPanel({ type: "none" });
          setStatusMessage(t("deactivated", { name: person.full_name }));
        },
        onError,
      });
      return;
    }

    resetPassword.mutate(person.id, {
      onSuccess: (result) => {
        setPanel({ type: "none" });
        setSecret({ message: t("resetNotice", { name: result.full_name }), secret: result.temporary_password });
      },
      onError,
    });
  };

  const renderActions = (person: SchoolAdmin) => {
    if (!isDirector || !person.is_active) {
      return null;
    }

    return (
      <>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => openPanel({ type: "confirm", action: "reset", person })}
        >
          {t("resetPassword")}
        </button>
        <button
          type="button"
          className={styles.dangerLink}
          onClick={() => openPanel({ type: "confirm", action: "deactivate", person })}
        >
          {t("deactivate")}
        </button>
      </>
    );
  };

  const renderList = () => {
    if (deputiesQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (deputiesQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(deputiesQuery.error, tApiErrors)}
          onRetry={() => deputiesQuery.refetch()}
        />
      );
    }

    if (deputiesQuery.data.length === 0) {
      return <DataState status="empty" message={t("emptyDeputies")} />;
    }

    return (
      <ul className={peopleStyles.list}>
        {deputiesQuery.data.map((person) => (
          <AdminPersonCard key={person.id} person={person} actions={renderActions(person)} />
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("deputiesTitle")}</h1>
          <p>{isDirector ? t("deputiesDescription") : t("deputiesDescriptionReadonly")}</p>
        </div>
        {isDirector && limits.canAddDeputy && (
          <button type="button" className={styles.primaryButton} onClick={() => openPanel({ type: "form" })}>
            <UserPlus size={16} aria-hidden="true" />
            {t("addDeputy")}
          </button>
        )}
      </header>

      {actionError && panel.type !== "confirm" && (
        <p className={styles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {actionError}
        </p>
      )}

      {statusMessage && (
        <p className={styles.notice} role="status">
          {statusMessage}
        </p>
      )}

      {secret && <SecretNotice message={secret.message} secret={secret.secret} onClose={() => setSecret(null)} />}

      {panel.type === "confirm" && (
        <section className={styles.card} role="alertdialog" aria-labelledby="deputy-confirm">
          <p id="deputy-confirm" className={styles.notice}>
            {panel.action === "reset"
              ? t("confirmReset", { name: panel.person.full_name })
              : t("confirmDeactivateDeputy", { name: panel.person.full_name })}
          </p>
          {actionError && (
            <p className={styles.formError} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {actionError}
            </p>
          )}
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => openPanel({ type: "none" })}>
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={cn(styles.primaryButton, panel.action === "deactivate" && styles.dangerButton)}
              disabled={deactivateDeputy.isPending || resetPassword.isPending}
              onClick={handleConfirm}
            >
              {panel.action === "reset" ? t("resetPassword") : t("deactivate")}
            </button>
          </div>
        </section>
      )}

      {panel.type === "form" && limits.canAddDeputy && (
        <AdminAccountForm
          title={t("addDeputy")}
          allowedRoles={["DEPUTY"]}
          isPending={createDeputy.isPending}
          error={createDeputy.error}
          onSubmit={({ inn, full_name, phone }) =>
            createDeputy.mutate(
              { inn, full_name, phone },
              {
                onSuccess: (person) => {
                  setPanel({ type: "none" });
                  if (person.temporary_password) {
                    setSecret({
                      message: t("createdNotice", { name: person.full_name, inn: person.inn }),
                      secret: person.temporary_password,
                    });
                  }
                },
              },
            )
          }
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {deputiesQuery.data && (
        <p className={limits.canAddDeputy ? styles.notice : styles.formError}>
          {limits.canAddDeputy
            ? t("deputiesCount", { count: limits.deputies, max: MAX_DEPUTIES })
            : t("deputiesFull", { max: MAX_DEPUTIES })}
        </p>
      )}

      <section className={styles.card}>{renderList()}</section>
    </div>
  );
}
