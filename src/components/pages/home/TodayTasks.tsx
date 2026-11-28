"use client";

import {
  AlarmClock,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  NotebookPen,
  TriangleAlert,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import type { Homework } from "@/apis/homeworks.api";
import { useAbsenceRequests } from "@/hooks/useAbsenceRequests";
import { useHomeworks } from "@/hooks/useHomeworks";
import { useTodaySchedule } from "@/hooks/useSchedule";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useTeachers } from "@/hooks/useTeachers";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import scss from "./home.module.scss";
import { QuickAbsence } from "./QuickAbsence";
import { WelcomeTips, useHasWelcomeTips } from "./WelcomeTips";

type TaskTone = "danger" | "warning" | "accent";

type Task = {
  key: string;
  icon: LucideIcon;
  tone: TaskTone;
  title: string;
  hint?: string;
  href: string;
};

const TONE_CLASS: Record<TaskTone, string> = {
  danger: scss.taskDanger,
  warning: scss.taskWarning,
  accent: scss.taskAccent,
};

function dateString(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// «Что сделать сегодня»: короткий список дел роли, каждый пункт ведёт туда, где дело делается.
// Собирается из уже существующих запросов (задания, заявки, расписание, учителя) — без нового API.
export function TodayTasks({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.tasks");
  const hasTips = useHasWelcomeTips(currentUser);
  const role = currentUser.role;
  const isAdmin = role === "DIRECTOR" || role === "DEPUTY";
  const isTeacher = role === "TEACHER" || role === "CLASS_TEACHER";
  const isStudentSide = role === "STUDENT" || role === "PARENT";
  const reviewsAbsences = isAdmin || Boolean(currentUser.is_class_teacher);

  const children = role === "PARENT" ? (currentUser.children ?? []) : [];
  const { selectedChildId } = useSelectedChild(children);
  const studentId = role === "PARENT" ? selectedChildId : null;
  const selectedChild = children.find((child) => child.id === selectedChildId);
  // Имя ребёнка («Эркин»): родителю с несколькими детьми важно, о ком дело.
  const childName = selectedChild ? (selectedChild.full_name.split(" ")[1] ?? selectedChild.full_name) : null;
  const withChild = (text: string) => (childName && children.length > 1 ? `${childName} · ${text}` : text);
  const homeworksQuery = useHomeworks(studentId, isStudentSide && (role === "STUDENT" || studentId !== null));
  const pendingAbsences = useAbsenceRequests("PENDING", reviewsAbsences || role === "PARENT");
  const todayQuery = useTodaySchedule(null, isTeacher);
  const teachersQuery = useTeachers(isAdmin);

  const tasks: Task[] = [];

  if (isStudentSide) {
    const homeworks: Homework[] = homeworksQuery.data ?? [];
    const open = homeworks.filter((homework) => !homework.is_submitted && homework.due_date);
    const today = dateString(0);
    const tomorrow = dateString(1);
    const overdue = open.filter((homework) => (homework.due_date ?? "") < today);
    const dueSoon = open.filter((homework) => homework.due_date === today || homework.due_date === tomorrow);

    if (overdue.length > 0) {
      tasks.push({
        key: "overdue",
        icon: TriangleAlert,
        tone: "danger",
        title: t("overdue", { count: overdue.length }),
        hint: withChild(overdue.map((homework) => homework.subject_name).filter(Boolean).slice(0, 3).join(", ")),
        href: "/homeworks",
      });
    }
    for (const homework of dueSoon.slice(0, 3)) {
      tasks.push({
        key: `due-${homework.id}`,
        icon: AlarmClock,
        tone: "warning",
        title: homework.due_date === today ? t("dueToday") : t("dueTomorrow"),
        hint: withChild(`${homework.subject_name ?? ""} · ${homework.title}`),
        href: "/homeworks",
      });
    }
  }

  const pendingCount = pendingAbsences.data?.length ?? 0;
  if (reviewsAbsences && pendingCount > 0) {
    tasks.push({
      key: "absences",
      icon: ClipboardCheck,
      tone: "accent",
      title: t("absencesToReview", { count: pendingCount }),
      href: "/absence-requests",
    });
  }
  if (role === "PARENT" && pendingCount > 0) {
    tasks.push({
      key: "absences",
      icon: ClipboardCheck,
      tone: "accent",
      title: t("absencesWaiting", { count: pendingCount }),
      href: "/absence-requests",
    });
  }

  if (isTeacher) {
    const lessonsToday = todayQuery.data?.lessons.length ?? 0;
    if (lessonsToday > 0) {
      tasks.push({
        key: "journal",
        icon: NotebookPen,
        tone: "accent",
        title: t("lessonsToday", { count: lessonsToday }),
        hint: t("fillJournal"),
        href: "/journal",
      });
    }
  }

  if (isAdmin) {
    const notLoggedIn = (teachersQuery.data ?? []).filter((teacher) => teacher.is_active && teacher.is_temp_password);
    if (notLoggedIn.length > 0) {
      tasks.push({
        key: "teachers",
        icon: UserRoundX,
        tone: "warning",
        title: t("teachersNotLoggedIn", { count: notLoggedIn.length }),
        hint: t("teachersHint"),
        href: "/admin/teachers",
      });
    }
  }

  return (
    <section className={scss.panel} aria-labelledby="today-tasks">
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <CircleCheck size={20} aria-hidden="true" />
          <h2 id="today-tasks">{t("title")}</h2>
        </div>
        {tasks.length > 0 && <span className={scss.panelMeta}>{t("count", { count: tasks.length })}</span>}
      </div>

      {tasks.length === 0 && hasTips && <WelcomeTips currentUser={currentUser} />}
      {tasks.length === 0 && !hasTips && (
        <p className={scss.tasksDone}>
          <CircleCheck size={18} aria-hidden="true" />
          {t("allDone")}
        </p>
      )}
      {tasks.length > 0 && (
        <ul className={scss.tasks}>
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <li key={task.key}>
                <Link href={task.href} className={cn(scss.task, TONE_CLASS[task.tone])}>
                  <span className={scss.taskIcon}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className={scss.taskText}>
                    <strong>{task.title}</strong>
                    {task.hint && <small>{task.hint}</small>}
                  </span>
                  <ChevronRight className={scss.taskArrow} size={18} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {role === "PARENT" && selectedChild && (
        <QuickAbsence
          studentId={selectedChild.id}
          childName={childName ?? selectedChild.full_name}
          today={dateString(0)}
          requests={pendingAbsences.data ?? []}
        />
      )}
    </section>
  );
}
