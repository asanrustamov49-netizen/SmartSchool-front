"use client";

import { ChevronRight, Circle, CircleCheck, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardStats } from "@/apis/dashboard.api";
import { useSubjects } from "@/hooks/useSubjects";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import scss from "./home.module.scss";

// Первые шаги новой школы. Блок исчезает сам, когда все шаги выполнены.
export function SetupChecklist({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("dashboard.setup");
  const subjectsQuery = useSubjects();

  if (!subjectsQuery.data) {
    return null;
  }

  const steps = [
    { key: "subjects", done: subjectsQuery.data.length > 0, href: "/admin/subjects" },
    { key: "classes", done: stats.classes > 0, href: "/admin/classes" },
    { key: "teachers", done: stats.teachers > 0, href: "/admin/teachers" },
    { key: "students", done: stats.students > 0, href: "/admin/students" },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) {
    return null;
  }

  return (
    <section className={scss.panel} aria-labelledby="setup-checklist">
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Rocket size={20} aria-hidden="true" />
          <h2 id="setup-checklist">{t("title")}</h2>
        </div>
        <span className={scss.panelMeta}>{t("progress", { done: doneCount, total: steps.length })}</span>
      </div>
      <div
        className={scss.setupProgress}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className={scss.tasks}>
        {steps.map((step) => {
          const Icon = step.done ? CircleCheck : Circle;
          return (
            <li key={step.key}>
              <Link href={step.href} className={cn(scss.task, step.done && scss.taskCompleted)}>
                <span className={scss.taskIcon}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className={scss.taskText}>
                  <strong>{t(`${step.key}.title`)}</strong>
                  <small>{t(`${step.key}.hint`)}</small>
                </span>
                <ChevronRight className={scss.taskArrow} size={18} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
