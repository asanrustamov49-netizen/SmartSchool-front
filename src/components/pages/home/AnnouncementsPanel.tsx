"use client";

import { CalendarDays, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useDateFormat } from "@/hooks/useDateFormat";
import { HOME_ANNOUNCEMENTS_LIMIT, useLatestAnnouncements } from "@/hooks/useDashboard";
import { handleApiError } from "@/lib/errorHandler";
import scss from "./home.module.scss";


export function AnnouncementsPanel() {
  const t = useTranslations("dashboard.announcements");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDate } = useDateFormat();
  const announcementsQuery = useLatestAnnouncements(HOME_ANNOUNCEMENTS_LIMIT);

  const renderContent = () => {
    if (announcementsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (announcementsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(announcementsQuery.error, tApiErrors)}
          onRetry={() => announcementsQuery.refetch()}
        />
      );
    }

    if (announcementsQuery.data.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ul className={scss.list}>
        {announcementsQuery.data.map((announcement) => (
          <li key={announcement.id} className={scss.announcementItem}>
            <strong>{announcement.title}</strong>
            {announcement.body && <p>{announcement.body}</p>}
            <span>
              <CalendarDays size={13} aria-hidden="true" />
              {formatDate(announcement.event_date ?? announcement.created_at)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Megaphone size={20} aria-hidden="true" />
          <h2>{t("title")}</h2>
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
