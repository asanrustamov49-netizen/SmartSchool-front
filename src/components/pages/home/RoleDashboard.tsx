"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { Link } from "@/i18n/navigation";
import type { HomeBlock } from "@/lib/preferences";
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
  const hiddenBlocks = usePreferences().preferences.hiddenHomeBlocks;

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

  const isShown = (block: HomeBlock) => !hiddenBlocks.includes(block);
  const isSchoolUser = currentUser.role !== "SYSTEM_ADMIN";
  const schoolPanels = [
    isShown("rating") && <SchoolRatingPanel key="rating" />,
    isShown("events") && <RecentEventsPanel key="events" />,
    isShown("announcements") && <AnnouncementsPanel key="announcements" />,
  ].filter(Boolean);
  // Сетка подстраивается под число оставленных блоков, чтобы не было пустых колонок.
  const panelsGridClass = schoolPanels.length === 3 ? scss.panelsGrid3 : scss.panelsGrid;

  return (
    <>
      <DashboardHero currentUser={currentUser} />
      <WelcomeTips currentUser={currentUser} />
      {isSchoolUser && isShown("tasks") && <TodayTasks currentUser={currentUser} />}
      {/* Расписание есть у учителя, ученика и родителя; директор смотрит его в разделе «Расписание». */}
      {["TEACHER", "CLASS_TEACHER", "STUDENT", "PARENT"].includes(currentUser.role) && isShown("lessons") && (
        <TodayLessonsPanel currentUser={currentUser} />
      )}
      {renderRoleContent()}
      {/* Рейтинг, события и объявления относятся к школе; у системного администратора школы нет. */}
      {isSchoolUser && schoolPanels.length > 1 && <div className={panelsGridClass}>{schoolPanels}</div>}
      {isSchoolUser && schoolPanels.length === 1 && schoolPanels}
      {isSchoolUser && (
        <Link href="/settings#home" className={scss.customizeLink}>
          <SlidersHorizontal size={15} aria-hidden="true" />
          {t("customize")}
        </Link>
      )}
    </>
  );
}
