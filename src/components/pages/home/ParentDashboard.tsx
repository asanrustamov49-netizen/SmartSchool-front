import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import scss from "./home.module.scss";

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Список детей приходит в /me в поле children.
export function ParentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.parent");
  const children = currentUser.children ?? [];

  return (
    <section className={scss.panel}>
      <div className={scss.panelHeading}>
        <div className={scss.headingTitle}>
          <Users size={20} aria-hidden="true" />
          <h2>{t("children")}</h2>
        </div>
      </div>
      {children.length === 0 ? (
        <DataState status="empty" message={t("noChildren")} />
      ) : (
        <ul className={scss.childGrid}>
          {children.map((child) => (
            <li key={child.id} className={scss.childCard}>
              <span className={scss.childAvatar} aria-hidden="true">
                {getInitials(child.full_name)}
              </span>
              <span>
                <strong>{child.full_name}</strong>
                <span>{child.class_name ?? t("noClass")}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
