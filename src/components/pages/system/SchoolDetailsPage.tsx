"use client";

import {
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Mail,
  MapPin,
  KeyRound,
  Pencil,
  Phone,
  Power,
  RotateCcw,
  UserPlus,
  UserRound,
  Users,
  UserX,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  canActivateAdmin,
  getAdminLimits,
  MAX_DEPUTIES,
  MAX_DIRECTORS,
  type SchoolAdmin,
  type SchoolAdminRole,
} from "@/apis/system.api";
import { DataState } from "@/components/ui/DataState";
import { RowActions } from "@/components/ui/RowActions";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  useAddSchoolAdmin,
  useResetSchoolAdminPassword,
  useSetSchoolActive,
  useSetSchoolAdminActive,
  useSystemSchool,
} from "@/hooks/useSystem";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { AdminAccountForm } from "../admin/AdminAccountForm";
import { AdminPersonCard } from "../admin/AdminPersonCard";
import { SecretNotice } from "../admin/SecretNotice";
import adminStyles from "../admin/admin.module.scss";
import peopleStyles from "../admin/people.module.scss";
import { MetricCard } from "../home/MetricCard";
import homeStyles from "../home/home.module.scss";
import { SchoolForm } from "./SchoolForm";
import styles from "./system.module.scss";

type Panel =
  | { type: "none" }
  | { type: "edit" }
  | { type: "addAdmin" }
  | { type: "confirmSchool" }
  | { type: "confirmAdmin"; action: "reset" | "deactivate"; person: SchoolAdmin };

type SecretState = { message: string; secret: string };

export function SchoolDetailsPage() {
  const t = useTranslations("system");
  const tPeople = useTranslations("people");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDate } = useDateFormat();
  const params = useParams<{ schoolId: string }>();
  const schoolId = Number(params.schoolId);
  const schoolQuery = useSystemSchool(schoolId);
  const setSchoolActive = useSetSchoolActive();
  const addAdmin = useAddSchoolAdmin();
  const resetPassword = useResetSchoolAdminPassword();
  const setAdminActive = useSetSchoolAdminActive();
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [secret, setSecret] = useState<SecretState | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const openPanel = (nextPanel: Panel) => {
    setSecret(null);
    setStatusMessage("");
    setActionError("");
    addAdmin.reset();
    setPanel(nextPanel);
  };

  if (schoolQuery.isPending) {
    return <DataState status="loading" />;
  }

  if (schoolQuery.isError) {
    return (
      <DataState
        status="error"
        message={handleApiError(schoolQuery.error, tApiErrors)}
        onRetry={() => schoolQuery.refetch()}
      />
    );
  }

  const school = schoolQuery.data;
  const admins = school.admins ?? [];
  const limits = getAdminLimits(admins);
  const allowedRoles: SchoolAdminRole[] = [
    ...(limits.canAddDirector ? (["DIRECTOR"] as const) : []),
    ...(limits.canAddDeputy ? (["DEPUTY"] as const) : []),
  ];
  const onError = (error: unknown) => setActionError(handleApiError(error, tApiErrors));

  const confirmSchool = () => {
    const active = !school.is_active;
    setSchoolActive.mutate(
      { schoolId: school.id, active },
      {
        onSuccess: () => {
          setPanel({ type: "none" });
          setStatusMessage(active ? t("reopened") : t("closedNotice"));
        },
        onError,
      },
    );
  };

  const confirmAdmin = () => {
    if (panel.type !== "confirmAdmin") {
      return;
    }
    const { person } = panel;

    if (panel.action === "deactivate") {
      setAdminActive.mutate(
        { userId: person.id, active: false },
        {
          onSuccess: () => {
            setPanel({ type: "none" });
            setStatusMessage(tPeople("deactivated", { name: person.full_name }));
          },
          onError,
        },
      );
      return;
    }

    resetPassword.mutate(person.id, {
      onSuccess: (result) => {
        setPanel({ type: "none" });
        setSecret({ message: tPeople("resetNotice", { name: result.full_name }), secret: result.temporary_password });
      },
      onError,
    });
  };

  const activateAdmin = (person: SchoolAdmin) => {
    openPanel({ type: "none" });
    setAdminActive.mutate(
      { userId: person.id, active: true },
      { onSuccess: () => setStatusMessage(tPeople("activated", { name: person.full_name })), onError },
    );
  };

  const renderAdminActions = (person: SchoolAdmin) => {
    if (!person.is_active) {
      // Включить нельзя, если лимит роли занят (1 директор, 5 завучей) — счётчики над списком.
      return (
        <RowActions
          menuLabel={`${tForm("actions")}: ${person.full_name}`}
          primary={{
            label: tPeople("activate"),
            icon: RotateCcw,
            disabled: !canActivateAdmin(person, limits),
            onSelect: () => activateAdmin(person),
          }}
        />
      );
    }

    return (
      <RowActions
        menuLabel={`${tForm("actions")}: ${person.full_name}`}
        primary={{
          label: tPeople("resetPassword"),
          icon: KeyRound,
          onSelect: () => openPanel({ type: "confirmAdmin", action: "reset", person }),
        }}
        actions={[
          {
            label: tPeople("deactivate"),
            icon: UserX,
            danger: true,
            onSelect: () => openPanel({ type: "confirmAdmin", action: "deactivate", person }),
          },
        ]}
      />
    );
  };

  const isConfirmPending = setSchoolActive.isPending || resetPassword.isPending || setAdminActive.isPending;

  return (
    <div className={adminStyles.page}>
      <Link href="/system/schools" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t("backToSchools")}
      </Link>

      <header className={adminStyles.pageHeader}>
        <div>
          <h1>
            {school.name}{" "}
            <span className={cn(styles.status, !school.is_active && styles.statusClosed)}>
              {school.is_active ? t("active") : t("closed")}
            </span>
          </h1>
          <p>{t("createdAt", { date: formatDate(school.created_at) })}</p>
        </div>
        <div className={adminStyles.headerActions}>
          <button type="button" className={adminStyles.secondaryButton} onClick={() => openPanel({ type: "edit" })}>
            <Pencil size={16} aria-hidden="true" />
            {tForm("edit")}
          </button>
          <button
            type="button"
            className={cn(adminStyles.secondaryButton, school.is_active && styles.dangerOutline)}
            onClick={() => openPanel({ type: "confirmSchool" })}
          >
            <Power size={16} aria-hidden="true" />
            {school.is_active ? t("close") : t("reopen")}
          </button>
        </div>
      </header>

      {!school.is_active && (
        <p className={adminStyles.formError}>
          <AlertCircle size={16} aria-hidden="true" />
          {t("closedWarning")}
        </p>
      )}

      {actionError && !panel.type.startsWith("confirm") && (
        <p className={adminStyles.formError} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {actionError}
        </p>
      )}

      {statusMessage && (
        <p className={adminStyles.notice} role="status">
          {statusMessage}
        </p>
      )}

      {secret && <SecretNotice message={secret.message} secret={secret.secret} onClose={() => setSecret(null)} />}

      {(panel.type === "confirmSchool" || panel.type === "confirmAdmin") && (
        <section className={adminStyles.card} role="alertdialog" aria-labelledby="system-confirm">
          <p id="system-confirm" className={adminStyles.notice}>
            {panel.type === "confirmSchool"
              ? school.is_active
                ? t("confirmClose", { name: school.name })
                : t("confirmReopen", { name: school.name })
              : panel.action === "reset"
                ? tPeople("confirmReset", { name: panel.person.full_name })
                : tPeople("confirmDeactivate", { name: panel.person.full_name })}
          </p>
          {actionError && (
            <p className={adminStyles.formError} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {actionError}
            </p>
          )}
          <div className={adminStyles.formActions}>
            <button type="button" className={adminStyles.secondaryButton} onClick={() => openPanel({ type: "none" })}>
              {tForm("cancel")}
            </button>
            <button
              type="button"
              className={cn(
                adminStyles.primaryButton,
                (panel.type === "confirmSchool" ? school.is_active : panel.action === "deactivate") &&
                  adminStyles.dangerButton,
              )}
              disabled={isConfirmPending}
              onClick={panel.type === "confirmSchool" ? confirmSchool : confirmAdmin}
            >
              {panel.type === "confirmSchool"
                ? school.is_active
                  ? t("close")
                  : t("reopen")
                : panel.action === "reset"
                  ? tPeople("resetPassword")
                  : tPeople("deactivate")}
            </button>
          </div>
        </section>
      )}

      {panel.type === "edit" && (
        <SchoolForm school={school} onCreated={() => undefined} onClose={() => setPanel({ type: "none" })} />
      )}

      <section className={homeStyles.metricsGrid} aria-label={t("statsTitle")}>
        <MetricCard icon={GraduationCap} value={school.stats.students} label={t("stats.students")} tone="blue" />
        <MetricCard icon={UserRound} value={school.stats.teachers} label={t("stats.teachers")} tone="violet" />
        <MetricCard icon={Users} value={school.stats.classes} label={t("stats.classes")} tone="sky" />
        <MetricCard
          icon={UserPlus}
          value={admins.filter((person) => person.is_active).length}
          label={t("stats.admins")}
          tone="amber"
        />
      </section>

      <div className={styles.detailsGrid}>
        <section className={adminStyles.card}>
          <h2 className={adminStyles.cardTitle}>{t("contacts")}</h2>
          <ul className={styles.contactList}>
            <li>
              <MapPin size={16} aria-hidden="true" />
              {school.address ?? t("noAddress")}
            </li>
            <li data-private>
              <Phone size={16} aria-hidden="true" />
              {school.phone ?? "—"}
            </li>
            <li data-private>
              <Mail size={16} aria-hidden="true" />
              {school.email ?? "—"}
            </li>
          </ul>
        </section>

        <section className={adminStyles.card}>
          <div className={styles.sectionHead}>
            <h2 className={adminStyles.cardTitle}>{t("admins")}</h2>
            {panel.type !== "addAdmin" && allowedRoles.length > 0 && (
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => openPanel({ type: "addAdmin" })}
              >
                <UserPlus size={16} aria-hidden="true" />
                {t("addAdmin")}
              </button>
            )}
          </div>

          <p className={styles.limits}>
            <span className={cn(!limits.canAddDirector && styles.limitFull)}>
              {t("directorsCount", { count: limits.directors, max: MAX_DIRECTORS })}
            </span>
            <span className={cn(!limits.canAddDeputy && styles.limitFull)}>
              {t("deputiesCount", { count: limits.deputies, max: MAX_DEPUTIES })}
            </span>
          </p>

          {allowedRoles.length === 0 && <p className={adminStyles.notice}>{t("limitsReached")}</p>}

          {panel.type === "addAdmin" && allowedRoles.length > 0 && (
            <AdminAccountForm
              title={t("addAdmin")}
              allowedRoles={allowedRoles}
              isPending={addAdmin.isPending}
              error={addAdmin.error}
              onSubmit={(data) =>
                addAdmin.mutate(
                  { schoolId: school.id, data },
                  {
                    onSuccess: (person) => {
                      setPanel({ type: "none" });
                      if (person.temporary_password) {
                        setSecret({
                          message: tPeople("createdNotice", { name: person.full_name, inn: person.inn }),
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

          {admins.length === 0 ? (
            <DataState
              status="empty"
              message={t("noAdmins")}
              action={{ label: t("addAdmin"), onClick: () => openPanel({ type: "addAdmin" }) }}
            />
          ) : (
            <ul className={peopleStyles.list}>
              {admins.map((person) => (
                <AdminPersonCard key={person.id} person={person} actions={renderAdminActions(person)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
