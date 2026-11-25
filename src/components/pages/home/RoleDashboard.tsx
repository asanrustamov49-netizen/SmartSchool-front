"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { DashboardHero } from "./DashboardHero";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { SchoolRatingPanel } from "./SchoolRatingPanel";
import { TodayLessonsPanel } from "./TodayLessonsPanel";
import { TodayTasks } from "./TodayTasks";
import { WelcomeTips } from "./WelcomeTips";
import scss from "./home.module.scss";

// Каждый пользователь загружает код только своей роли: например, экран системного администратора
// со списком школ и формами не попадает в главную учителя или родителя.
const loading = () => <DataState status="loading" />;
const AdminDashboard = dynamic(() => import("./AdminDashboard").then((module) => module.AdminDashboard), { loading });
const ParentDashboard = dynamic(() => import("./ParentDashboard").then((module) => module.ParentDashboard), { loading });
const StudentDashboard = dynamic(() => import("./StudentDashboard").then((module) => module.StudentDashboard), { loading });
const SystemDashboard = dynamic(() => import("./SystemDashboard").then((module) => module.SystemDashboard), { loading });
const TeacherDashboard = dynamic(() => import("./TeacherDashboard").then((module) => module.TeacherDashboard), { loading });

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
      case "SYSTEM_ADMIN":
        return <SystemDashboard />;
      default:
        return <DataState status="empty" message={t("systemEmpty")} />;
    }
  };

  return (
    <>
      <DashboardHero currentUser={currentUser} />
      <WelcomeTips currentUser={currentUser} />
      {currentUser.role !== "SYSTEM_ADMIN" && <TodayTasks currentUser={currentUser} />}
      {/* Расписание есть у учителя, ученика и родителя; директор смотрит его в разделе «Расписание». */}
      {["TEACHER", "CLASS_TEACHER", "STUDENT", "PARENT"].includes(currentUser.role) && (
        <TodayLessonsPanel currentUser={currentUser} />
      )}
      {renderRoleContent()}
      {/* Рейтинг, события и объявления относятся к школе; у системного администратора школы нет. */}
      {currentUser.role !== "SYSTEM_ADMIN" && (
        <div className={scss.panelsGrid3}>
          <SchoolRatingPanel />
          <RecentEventsPanel />
          <AnnouncementsPanel />
        </div>
      )}
    </>
  );
}
