"use client";

import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useMySchool } from "@/hooks/useSchool";
import { handleApiError } from "@/lib/errorHandler";
import { SchoolImages } from "./SchoolImages";
import { SchoolProfileForm } from "./SchoolProfileForm";
import styles from "./admin.module.scss";

export function SchoolProfilePage() {
  const t = useTranslations("admin.school");
  const tApiErrors = useTranslations("apiErrors");
  const schoolQuery = useMySchool();

  const renderContent = () => {
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

    return (
      <>
        <SchoolProfileForm school={schoolQuery.data} />
        <SchoolImages school={schoolQuery.data} />
      </>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </header>
      {renderContent()}
    </div>
  );
}
