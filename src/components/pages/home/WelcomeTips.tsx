"use client";

import { ChevronRight, Lightbulb, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser, UserRole } from "@/apis/auth.api";
import { useTipsDismissed } from "@/hooks/useAppearance";
import { Link } from "@/i18n/navigation";
import { dismissTips } from "@/lib/appearance";
import scss from "./home.module.scss";

type Tip = { key: string; href: string };

// Первые шаги для каждой роли. У директора свой чеклист настройки школы (SetupChecklist).
const TIPS: Partial<Record<UserRole, Tip[]>> = {
  DEPUTY: [
    { key: "deputySchedule", href: "/schedule" },
    { key: "deputyJournal", href: "/journal" },
    { key: "profile", href: "/profile" },
  ],
  TEACHER: [
    { key: "teacherJournal", href: "/journal" },
    { key: "teacherHomeworks", href: "/homeworks" },
    { key: "profile", href: "/profile" },
  ],
  CLASS_TEACHER: [
    { key: "classTeacherCodes", href: "/my-class" },
    { key: "teacherJournal", href: "/journal" },
    { key: "teacherHomeworks", href: "/homeworks" },
  ],
  STUDENT: [
    { key: "studentDiary", href: "/diary" },
    { key: "studentHomeworks", href: "/homeworks" },
    { key: "studentRatings", href: "/ratings" },
  ],
  PARENT: [
    { key: "parentDiary", href: "/diary" },
    { key: "parentAbsence", href: "/absence-requests" },
    { key: "parentEmails", href: "/profile" },
  ],
};

// Карточка «С чего начать» на главной. Скрывается навсегда кнопкой «Понятно» (в этом браузере).
export function WelcomeTips({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.tips");
  const dismissed = useTipsDismissed(currentUser.id);
  // Классный руководитель приходит с ролью TEACHER и признаком is_class_teacher.
  const role = currentUser.is_class_teacher ? "CLASS_TEACHER" : currentUser.role;
  const tips = TIPS[role];

  if (!tips || dismissed) {
    return null;
  }

  return (
    <section className={scss.panel} aria-labelledby="welcome-tips">
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Lightbulb size={20} aria-hidden="true" />
          <h2 id="welcome-tips">{t("title")}</h2>
        </div>
        <button
          type="button"
          className={scss.tipsDismiss}
          onClick={() => dismissTips(currentUser.id)}
        >
          <X size={15} aria-hidden="true" />
          {t("dismiss")}
        </button>
      </div>
      <ol className={scss.tasks}>
        {tips.map((tip) => (
          <li key={tip.key}>
            <Link href={tip.href} className={scss.task}>
              <span className={scss.taskText}>
                <strong>{t(`${tip.key}.title`)}</strong>
                <small>{t(`${tip.key}.hint`)}</small>
              </span>
              <ChevronRight className={scss.taskArrow} size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
