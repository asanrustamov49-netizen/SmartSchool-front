"use client";

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser, UserRole } from "@/apis/auth.api";
import { useDateFormat } from "@/hooks/useDateFormat";
import { getMediaUrl } from "@/lib/utils";
import { HeroBanner } from "./HeroBanner";
import scss from "./home.module.scss";

type HeroTone = "admin" | "teacher" | "student" | "parent" | "system";

const ROLE_TONE: Record<UserRole, HeroTone> = {
  DIRECTOR: "admin",
  DEPUTY: "admin",
  TEACHER: "teacher",
  CLASS_TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  SYSTEM_ADMIN: "system",
};

const TONE_ICON: Record<HeroTone, LucideIcon> = {
  admin: School,
  teacher: BookOpen,
  student: GraduationCap,
  parent: Users,
  system: ShieldCheck,
};

function getGreetingKey(hour: number) {
  if (hour < 5) {
    return "greetingNight";
  }

  if (hour < 12) {
    return "greetingMorning";
  }

  if (hour < 18) {
    return "greetingDay";
  }

  return "greetingEvening";
}

// Чипы показывают только то, что уже пришло в /me.
function getChips(user: CurrentUser, t: ReturnType<typeof useTranslations>) {
  const chips: string[] = [];

  if (user.school?.name && user.role !== "STUDENT") {
    chips.push(user.school.name);
  }

  for (const schoolClass of user.classes_led ?? []) {
    if (schoolClass.name) {
      chips.push(t("chipClassLed", { name: schoolClass.name }));
    }
  }

  if (user.assignments && user.assignments.length > 0) {
    chips.push(t("chipSubjects", { count: user.assignments.length }));
  }

  if (user.student?.class_name) {
    chips.push(t("chipClass", { name: user.student.class_name }));
  }

  if (user.student) {
    chips.push(t("chipXp", { count: user.student.total_xp }));
  }

  if (user.children && user.children.length > 0) {
    chips.push(t("chipChildren", { count: user.children.length }));
  }

  return chips;
}

// Персональный баннер главной: приветствие по времени суток, имя, роль и данные из /me.
export function DashboardHero({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.hero");
  const tRole = useTranslations("app.role");
  const { formatLongDate } = useDateFormat();
  const now = new Date();
  const tone = ROLE_TONE[currentUser.role] ?? "system";
  const Icon = TONE_ICON[tone];
  const chips = getChips(currentUser, t);
  const bannerUrl = currentUser.school?.banner_url;
  const logoUrl = currentUser.school?.logo_url;

  return (
    <header
      className={scss.hero}
      data-tone={tone}
      data-banner={bannerUrl ? "true" : undefined}
      data-spotlight={bannerUrl ? undefined : "layer"}
    >
      {/* Свет за курсором — только на градиентном баннере, не поверх фото школы. */}
      {!bannerUrl && <span data-spotlight-glow aria-hidden="true" />}
      {/* Баннер школы из «Настроек школы»: фон с затемнением, чтобы текст оставался читаемым. */}
      {bannerUrl && <HeroBanner bannerUrl={bannerUrl} saved={currentUser.banner_position} />}
      <div className={scss.heroCopy}>
        <span className={scss.heroBrand}>
          <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
          {formatLongDate(now)}
        </span>
        <h1>
          {t(getGreetingKey(now.getHours()))}, {currentUser.full_name}
        </h1>
        <p>
          {tRole(currentUser.role)} · {t(`subtitle.${tone}`)}
        </p>
        {chips.length > 0 && (
          <ul className={scss.heroChips}>
            {chips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={scss.heroArtwork} aria-hidden="true">
        <div className={scss.heroOrbit} />
        <div className={scss.heroSchool}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API
            <img className={scss.heroLogo} src={getMediaUrl(logoUrl)} alt="" />
          ) : (
            <Icon size={58} strokeWidth={1.4} />
          )}
        </div>
        <Sparkles className={scss.heroSparkle} size={20} />
      </div>
    </header>
  );
}
