"use client";

import { ChevronRight, GraduationCap, MapPin, Plus, School, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SystemSchool, SystemSchoolCreated } from "@/apis/system.api";
import { DataState } from "@/components/ui/DataState";
import { useSystemSchools } from "@/hooks/useSystem";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn, getMediaUrl } from "@/lib/utils";
import { SecretNotice } from "../admin/SecretNotice";
import adminStyles from "../admin/admin.module.scss";
import { SchoolForm } from "./SchoolForm";
import styles from "./system.module.scss";

type StatusFilter = "all" | "active" | "inactive";

function getInitials(name: string) {
  return name
    .replace(/[«»"№]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function SchoolCard({ school }: { school: SystemSchool }) {
  const t = useTranslations("system");

  return (
    <Link href={`/system/schools/${school.id}`} className={styles.schoolCard}>
      <div className={styles.schoolHead}>
        {school.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API
          <img className={styles.schoolLogo} src={getMediaUrl(school.logo_url)} alt="" />
        ) : (
          <span className={styles.schoolLogo} aria-hidden="true">
            {getInitials(school.name) || <School size={20} />}
          </span>
        )}
        <span className={styles.schoolTitle}>
          <strong>{school.name}</strong>
          <span>
            <MapPin size={13} aria-hidden="true" />
            {school.address ?? t("noAddress")}
          </span>
        </span>
        <span className={cn(styles.status, !school.is_active && styles.statusClosed)}>
          {school.is_active ? t("active") : t("closed")}
        </span>
      </div>

      <dl className={styles.schoolStats}>
        <div>
          <dt>
            <GraduationCap size={15} aria-hidden="true" />
            {t("stats.students")}
          </dt>
          <dd>{school.stats.students}</dd>
        </div>
        <div>
          <dt>
            <UserRound size={15} aria-hidden="true" />
            {t("stats.teachers")}
          </dt>
          <dd>{school.stats.teachers}</dd>
        </div>
        <div>
          <dt>
            <Users size={15} aria-hidden="true" />
            {t("stats.classes")}
          </dt>
          <dd>{school.stats.classes}</dd>
        </div>
      </dl>

      <span className={styles.schoolFooter}>
        <span>{school.director_name ? t("directorName", { name: school.director_name }) : t("noDirector")}</span>
        <ChevronRight size={18} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function SchoolsPage() {
  const t = useTranslations("system");
  const tForm = useTranslations("admin.form");
  const tApiErrors = useTranslations("apiErrors");
  const schoolsQuery = useSystemSchools();
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState<SystemSchoolCreated | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const normalizedSearch = search.trim().toLowerCase();
  const schools = (schoolsQuery.data ?? []).filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(normalizedSearch) ||
      (school.address ?? "").toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active") === school.is_active;
    return matchesSearch && matchesStatus;
  });

  const renderList = () => {
    if (schoolsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (schoolsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(schoolsQuery.error, tApiErrors)}
          onRetry={() => schoolsQuery.refetch()}
        />
      );
    }

    if (schools.length === 0) {
      const isFiltered = normalizedSearch !== "" || statusFilter !== "all";
      return <DataState status="empty" message={isFiltered ? tForm("nothingFound") : t("empty")} />;
    }

    return (
      <div className={styles.schoolGrid}>
        {schools.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>
    );
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <button
          type="button"
          className={adminStyles.primaryButton}
          onClick={() => {
            setCreated(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          {t("add")}
        </button>
      </header>

      {created && (
        <SecretNotice
          message={t("createdNotice", {
            school: created.school.name,
            name: created.director.full_name,
            inn: created.director.inn,
          })}
          secret={created.director.temporary_password}
          onClose={() => setCreated(null)}
        />
      )}

      {formOpen && (
        <SchoolForm
          school={null}
          onCreated={(result) => {
            setFormOpen(false);
            setCreated(result);
          }}
          onClose={() => setFormOpen(false)}
        />
      )}

      <section className={adminStyles.card}>
        <div className={adminStyles.toolbar}>
          <input
            type="search"
            className={adminStyles.searchInput}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={adminStyles.select}
            aria-label={t("statusFilter")}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">{t("allStatuses")}</option>
            <option value="active">{t("onlyActive")}</option>
            <option value="inactive">{t("onlyClosed")}</option>
          </select>
          {schoolsQuery.data && (
            <span className={adminStyles.toolbarCount}>{t("count", { count: schools.length })}</span>
          )}
        </div>
        {renderList()}
      </section>
    </div>
  );
}
