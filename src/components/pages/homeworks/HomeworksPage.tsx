"use client";

import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { StudentHomeworks } from "./StudentHomeworks";
import { TeacherHomeworks } from "./TeacherHomeworks";
import adminStyles from "../admin/admin.module.scss";

export function HomeworksPage() {
  const t = useTranslations("homeworks");
  const user = useCurrentUser().data;
  const isTeacher = user?.role === "TEACHER" || user?.role === "CLASS_TEACHER";

  const renderContent = () => {
    if (!user) {
      return <DataState status="loading" />;
    }
    return isTeacher ? <TeacherHomeworks /> : <StudentHomeworks user={user} />;
  };

  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1>{t("title")}</h1>
          <p>{isTeacher ? t("descriptionTeacher") : t("description")}</p>
        </div>
      </header>
      {renderContent()}
    </div>
  );
}
