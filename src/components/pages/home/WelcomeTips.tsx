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

// Классный руководитель приходит с ролью TEACHER и признаком is_class_teacher.
function getTips(currentUser: CurrentUser): Tip[] | undefined {
  return TIPS[currentUser.is_class_teacher ? "CLASS_TEACHER" : currentUser.role];
}

// Есть ли советы «С чего начать», которые пользователь ещё не скрыл.
export function useHasWelcomeTips(currentUser: CurrentUser): boolean {
  const dismissed = useTipsDismissed(currentUser.id);
  return Boolean(getTips(currentUser)) && !dismissed;
}

// Советы «С чего начать» внутри блока «Что сделать сегодня»: показываются, пока срочных дел нет
// (обычно у нового пользователя). Скрываются навсегда кнопкой «Понятно» (в этом браузере).
export function WelcomeTips({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.tips");
  const tips = getTips(currentUser);

  if (!tips) {
    return null;
  }

  return (
    <div className={scss.tipsBlock}>
      <div className={scss.tipsHeading}>
        <span>
          <Lightbulb size={16} aria-hidden="true" />
          {t("title")}
        </span>
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
    </div>
  );
}
