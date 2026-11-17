"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, Moon, Sun, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { CurrentUser } from "@/apis/auth.api";
import { useLogout } from "@/hooks/useAuth";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn, getMediaUrl } from "@/lib/utils";
import type { NavigationItem } from "./navigation";
import styles from "./MobileMoreSheet.module.scss";

type MobileMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: CurrentUser;
  // Разделы, которых нет в нижней панели, и личные страницы (профиль, настройки).
  items: NavigationItem[];
  accountItems: NavigationItem[];
  activeKey: string | undefined;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Лист «Ещё» на телефоне и планшете: все остальные разделы крупными плитками,
// профиль, язык, тема и выход — всё в одном месте у большого пальца.
export function MobileMoreSheet({
  open,
  onOpenChange,
  currentUser,
  items,
  accountItems,
  activeKey,
}: MobileMoreSheetProps) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const isDark = resolvedTheme === "dark";
  const close = () => onOpenChange(false);

  const renderTile = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = item.key === activeKey;
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cn(styles.tile, isActive && styles.tileActive)}
        aria-current={isActive ? "page" : undefined}
        onClick={close}
      >
        <span className={styles.tileIcon}>
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className={styles.tileLabel}>{t(`nav.${item.key}`)}</span>
      </Link>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.sheet}>
          <span className={styles.handle} aria-hidden="true" />

          <div className={styles.header}>
            <span className={styles.avatar} aria-hidden="true">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API
                <img src={getMediaUrl(currentUser.avatar_url)} alt="" />
              ) : (
                getInitials(currentUser.full_name)
              )}
            </span>
            <span className={styles.identity}>
              <Dialog.Title className={styles.name}>{currentUser.full_name}</Dialog.Title>
              <span className={styles.role}>
                {t(`role.${currentUser.role}`)}
                {currentUser.school ? ` · ${currentUser.school.name}` : ""}
              </span>
            </span>
            <Dialog.Close className={styles.close} aria-label={t("closeMenu")}>
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            {items.length > 0 && (
              <section>
                <h2 className={styles.sectionTitle}>{t("moreSections")}</h2>
                <nav className={styles.grid} aria-label={t("moreSections")}>
                  {items.map(renderTile)}
                </nav>
              </section>
            )}

            <section>
              <h2 className={styles.sectionTitle}>{t("moreAccount")}</h2>
              <div className={styles.grid}>{accountItems.map(renderTile)}</div>
            </section>

            <section className={styles.quick}>
              <div className={styles.segmented} role="group" aria-label={t("language")}>
                {(["ky", "ru"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={locale === item}
                    className={cn(styles.segment, locale === item && styles.segmentActive)}
                    onClick={() => router.replace(pathname, { locale: item })}
                  >
                    {item === "ky" ? "Кыргызча" : "Русский"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.themeButton}
                aria-label={t("toggleTheme")}
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                {isDark ? t("themeLight") : t("themeDark")}
              </button>
            </section>

            <button type="button" className={styles.logout} onClick={logout}>
              <LogOut size={18} aria-hidden="true" />
              {tCommon("logout")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
