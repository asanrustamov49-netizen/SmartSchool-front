"use client";

import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { useLogout } from "@/hooks/useAuth";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn, getMediaUrl } from "@/lib/utils";
import type { NavigationItem } from "./navigation";
import styles from "./account-menu.module.scss";

type AccountMenuProps = {
  currentUser: CurrentUser;
  items: NavigationItem[];
  // Свёрнутое меню показывает только аватар, подпись берётся из title.
  collapsed: boolean;
  onNavigate: () => void;
};

function UserAvatar({ user, large }: { user: CurrentUser; large?: boolean }) {
  return (
    <span className={cn(styles.avatar, large && styles.avatarLarge)} aria-hidden="true">
      {user.avatar_url ? (
        // Файл лежит на сервере API, поэтому обычный img без оптимизации next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getMediaUrl(user.avatar_url)} alt="" />
      ) : (
        user.full_name.charAt(0)
      )}
    </span>
  );
}

export function AccountMenu({ currentUser, items, collapsed, onNavigate }: AccountMenuProps) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const roleLabel = t(`role.${currentUser.role}`);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeAndNavigate = () => {
    setIsOpen(false);
    onNavigate();
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {isOpen && (
        <div className={styles.menu} role="menu" aria-label={t("account.menu")}>
          <div className={styles.header}>
            <UserAvatar user={currentUser} large />
            <span className={styles.headerText}>
              <strong>{currentUser.full_name}</strong>
              <small>{roleLabel}</small>
              {currentUser.school && <small>{currentUser.school.name}</small>}
            </span>
          </div>

          <div className={styles.group}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  role="menuitem"
                  className={cn(styles.item, pathname === item.href && styles.itemActive)}
                  onClick={closeAndNavigate}
                >
                  <Icon size={17} aria-hidden="true" />
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </div>

          <div className={styles.group}>
            <div className={styles.row}>
              <span>{t("account.theme")}</span>
              <div className={styles.segmented} role="group" aria-label={t("account.theme")}>
                <button
                  type="button"
                  aria-label={t("account.light")}
                  aria-pressed={resolvedTheme !== "dark"}
                  className={cn(resolvedTheme !== "dark" && styles.segmentActive)}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={t("account.dark")}
                  aria-pressed={resolvedTheme === "dark"}
                  className={cn(resolvedTheme === "dark" && styles.segmentActive)}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className={styles.row}>
              <span>{t("account.language")}</span>
              <div className={styles.segmented} role="group" aria-label={t("account.language")}>
                {routing.locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={item === locale}
                    className={cn(item === locale && styles.segmentActive)}
                    onClick={() => router.replace(pathname, { locale: item })}
                  >
                    {item === "ky" ? "KG" : "RU"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.group}>
            <button type="button" role="menuitem" className={cn(styles.item, styles.itemDanger)} onClick={logout}>
              <LogOut size={17} aria-hidden="true" />
              {tCommon("logout")}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={cn(styles.trigger, isOpen && styles.triggerOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={collapsed ? currentUser.full_name : undefined}
        onClick={() => setIsOpen((value) => !value)}
      >
        <UserAvatar user={currentUser} />
        <span className={styles.triggerText}>
          <strong>{currentUser.full_name}</strong>
          <small>{roleLabel}</small>
        </span>
        <ChevronsUpDown size={16} className={styles.triggerIcon} aria-hidden="true" />
      </button>
    </div>
  );
}
