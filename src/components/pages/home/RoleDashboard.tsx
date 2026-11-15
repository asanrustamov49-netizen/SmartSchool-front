"use client";

import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { AdminDashboard } from "./AdminDashboard";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { DashboardHero } from "./DashboardHero";
import { ParentDashboard } from "./ParentDashboard";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { SchoolRatingPanel } from "./SchoolRatingPanel";
import { StudentDashboard } from "./StudentDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import { TodayLessonsPanel } from "./TodayLessonsPanel";
import scss from "./home.module.scss";

// Роль известна только после /me на клиенте. AppShell показывает страницу,
// когда пользователь уже загружен, поэтому здесь данные берутся из кэша.
export function RoleDashboard() {
  const t = useTranslations("dashboard");
  const currentUser = useCurrentUser().data;

  if (!currentUser) {
    return null;
  }

  const renderRoleContent = () => {
    switch (currentUser.role) {
      case "DIRECTOR":
      case "DEPUTY":
        return <AdminDashboard />;
      case "TEACHER":
      case "CLASS_TEACHER":
        return <TeacherDashboard currentUser={currentUser} />;
      case "STUDENT":
        return <StudentDashboard currentUser={currentUser} />;
      case "PARENT":
        return <ParentDashboard currentUser={currentUser} />;
      default:
        // Для SYSTEM_ADMIN в API нет отдельных данных главной — показываем честное пустое состояние.
        return <DataState status="empty" message={t("systemEmpty")} />;
    }
  };

  return (
    <>
      <DashboardHero currentUser={currentUser} />
      {/* Расписание есть у учителя, ученика и родителя; директор смотрит его в разделе «Расписание». */}
      {["TEACHER", "CLASS_TEACHER", "STUDENT", "PARENT"].includes(currentUser.role) && (
        <TodayLessonsPanel currentUser={currentUser} />
      )}
      {renderRoleContent()}
      <div className={scss.panelsGrid3}>
        <SchoolRatingPanel />
        <RecentEventsPanel />
        <AnnouncementsPanel />
      </div>
    </>
  );
}
