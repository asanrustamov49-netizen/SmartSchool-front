"use client";

import { BellRing } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import { handleApiError } from "@/lib/errorHandler";
import scss from "./home.module.scss";

const RECENT_EVENTS_LIMIT = 5;

// Последние события — это личные уведомления пользователя из /notifications.
export function RecentEventsPanel() {
  const t = useTranslations("dashboard.events");
  const tApiErrors = useTranslations("apiErrors");
  const format = useFormatter();
  const notificationsQuery = useNotifications(RECENT_EVENTS_LIMIT, true);
  const markRead = useMarkNotificationRead();

  const renderContent = () => {
    if (notificationsQuery.isPending) {
      return <DataState status="loading" />;
    }

    if (notificationsQuery.isError) {
      return (
        <DataState
          status="error"
          message={handleApiError(notificationsQuery.error, tApiErrors)}
          onRetry={() => notificationsQuery.refetch()}
        />
      );
    }

    if (notificationsQuery.data.length === 0) {
      return <DataState status="empty" message={t("empty")} />;
    }

    return (
      <ol className={scss.timeline}>
        {notificationsQuery.data.map((notification) => (
          <li
            key={notification.id}
            className={notification.is_read ? scss.timelineItem : `${scss.timelineItem} ${scss.timelineUnread}`}
          >
            <button
              type="button"
              className={scss.timelineButton}
              onClick={() => {
                if (!notification.is_read) {
                  markRead.mutate(notification.id);
                }
              }}
            >
              <strong>{notification.title}</strong>
              {notification.body && <span>{notification.body}</span>}
              <time dateTime={notification.created_at}>
                {format.relativeTime(new Date(notification.created_at))}
              </time>
            </button>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <BellRing size={20} aria-hidden="true" />
          <h2>{t("title")}</h2>
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
