import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/apis/auth.api";
import { DataState } from "@/components/ui/DataState";
import scss from "./home.module.scss";

// Список детей приходит в /me в поле children.
export function ParentDashboard({ currentUser }: { currentUser: CurrentUser }) {
  const t = useTranslations("dashboard.parent");
  const children = currentUser.children ?? [];

  return (
    <div className={scss.panelsGrid}>
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
          <ul className={scss.list}>
            {children.map((child) => (
              <li key={child.id} className={scss.listRow}>
                <strong>{child.full_name}</strong>
                <span>{child.class_name ?? t("noClass")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
