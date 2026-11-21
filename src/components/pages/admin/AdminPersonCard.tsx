"use client";

import { Eye, EyeOff, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import type { SchoolAdmin } from "@/apis/system.api";
import { cn } from "@/lib/utils";
import styles from "./people.module.scss";

type AdminPersonCardProps = {
  person: SchoolAdmin;
  actions: ReactNode;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Карточка директора или завуча. Пока человек не сменил выданный пароль,
// backend отдаёт временный пароль — его можно показать и передать человеку ещё раз.
export function AdminPersonCard({ person, actions }: AdminPersonCardProps) {
  const t = useTranslations("people");
  const tRole = useTranslations("app.role");
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <li className={cn(styles.person, !person.is_active && styles.personInactive)}>
      <span className={cn(styles.avatar, person.role === "DIRECTOR" && styles.avatarDirector)} aria-hidden="true">
        {getInitials(person.full_name)}
      </span>

      <div className={styles.personInfo}>
        <strong>{person.full_name}</strong>
        <span className={styles.personMeta}>
          <span className={styles.roleBadge}>{tRole(person.role)}</span>
          <span data-private>
            {t("inn")}: {person.inn}
          </span>
          {person.phone && (
            <span data-private>
              <Phone size={12} aria-hidden="true" />
              {person.phone}
            </span>
          )}
          {!person.is_active && <span className={styles.inactive}>{t("inactive")}</span>}
        </span>

        {person.is_temp_password && (
          <span className={styles.tempPassword}>
            {t("notLoggedIn")}
            {person.temporary_password && (
              <>
                {" · "}
                {passwordVisible ? (
                  <span className={styles.secret}>{person.temporary_password}</span>
                ) : (
                  t("tempPasswordHidden")
                )}
                <button
                  type="button"
                  aria-label={passwordVisible ? t("hidePassword") : t("showPassword")}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                </button>
              </>
            )}
          </span>
        )}
      </div>

      <div className={styles.personActions}>{actions}</div>
    </li>
  );
}
