"use client";

import { AlertCircle, KeyRound, Pencil, RotateCcw, UserPlus, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getAdminLimits, MAX_DEPUTIES, type SchoolAdmin } from "@/apis/system.api";
import { DataState } from "@/components/ui/DataState";
import { RowActions } from "@/components/ui/RowActions";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useActivateDeputy,
  useCreateDeputy,
  useDeactivateDeputy,
  useDeputies,
  useResetDeputyPassword,
  useUpdateDeputy,
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
  | { type: "edit"; person: SchoolAdmin }
  | { type: "confirm"; action: "reset" | "deactivate"; person: SchoolAdmin };

type SecretState = { message: string; secret: string };

// Завучи школы. Директор добавляет, изменяет, удаляет (отключает доступ), возвращает
// и сбрасывает пароль — только завучам своей школы (backend: /admin/deputies).
// Завуч видит список коллег только для чтения.
export function DeputiesPage() {
  const t = useTranslations("people");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const isDirector = useCurrentUser().data?.role === "DIRECTOR";
  const deputiesQuery = useDeputies();
  const createDeputy = useCreateDeputy();
  const deactivateDeputy = useDeactivateDeputy();
  const updateDeputy = useUpdateDeputy();
  const activateDeputy = useActivateDeputy();
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
    updateDeputy.reset();
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
          setStatusMessage(t("removed", { name: person.full_name }));
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

  const handleActivate = (person: SchoolAdmin) => {
    openPanel({ type: "none" });
    activateDeputy.mutate(person.id, {
      onSuccess: () => setStatusMessage(t("activated", { name: person.full_name })),
      onError: (error) => setActionError(handleApiError(error, tApiErrors)),
    });
  };

  const renderActions = (person: SchoolAdmin) => {
    if (!isDirector) {
      return null;
    }

    if (!person.is_active) {
      // При пяти активных завучах вернуть нельзя — кнопка неактивна (лимит показан над списком).
      return (
        <RowActions
          menuLabel={`${tForm("actions")}: ${person.full_name}`}
          primary={{
            label: t("restore"),
            icon: RotateCcw,
            disabled: !limits.canAddDeputy || activateDeputy.isPending,
            onSelect: () => handleActivate(person),
          }}
        />
      );
    }

    return (
      <RowActions
        menuLabel={`${tForm("actions")}: ${person.full_name}`}
        primary={{ label: tForm("edit"), icon: Pencil, onSelect: () => openPanel({ type: "edit", person }) }}
        actions={[
          {
            label: t("resetPassword"),
            icon: KeyRound,
            onSelect: () => openPanel({ type: "confirm", action: "reset", person }),
          },
          {
            label: t("remove"),
            icon: UserX,
            danger: true,
            onSelect: () => openPanel({ type: "confirm", action: "deactivate", person }),
          },
        ]}
      />
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
      return (
        <DataState
          status="empty"
          message={t("emptyDeputies")}
          action={isDirector ? { label: t("addDeputy"), onClick: () => openPanel({ type: "form" }) } : undefined}
        />
      );
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
              : t("confirmRemoveDeputy", { name: panel.person.full_name })}
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
              {panel.action === "reset" ? t("resetPassword") : t("remove")}
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

      {panel.type === "edit" && (
        <AdminAccountForm
          key={panel.person.id}
          title={t("editDeputy")}
          person={panel.person}
          allowedRoles={["DEPUTY"]}
          isPending={updateDeputy.isPending}
          error={updateDeputy.error}
          onSubmit={({ full_name, phone }) =>
            updateDeputy.mutate(
              { userId: panel.person.id, data: { full_name, phone } },
              {
                onSuccess: (person) => {
                  setPanel({ type: "none" });
                  setStatusMessage(t("saved", { name: person.full_name }));
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
