"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { AdminDashboard } from "./AdminDashboard";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { ParentDashboard } from "./ParentDashboard";
import { SchoolRatingPanel } from "./SchoolRatingPanel";
import { StudentDashboard } from "./StudentDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import scss from "./home.module.scss";

// Роль известна только после /me на клиенте. AppShell показывает страницу,
// когда пользователь уже загружен, поэтому здесь данные берутся из кэша.
export function RoleDashboard() {
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
        return null;
    }
  };

  return (
    <>
      {renderRoleContent()}
      <div className={scss.panelsGrid}>
        <SchoolRatingPanel />
        <AnnouncementsPanel />
      </div>
    </>
  );
}
