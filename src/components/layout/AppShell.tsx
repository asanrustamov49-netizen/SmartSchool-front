"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  CircleAlert,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  Search,
  School,
  ShieldAlert,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { Logo } from "@/components/ui/Logo";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { handleApiError } from "@/lib/errorHandler";
import {
  getCurrentNavigationItem,
  getMobileItems,
  getRoleNavigation,
  isPathAllowed,
  type NavigationItem,
} from "./navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import styles from "./app-shell.module.scss";

// В backend нет поиска, поэтому поле скрыто. Включить, когда появится endpoint поиска.
const IS_SEARCH_ENABLED = false;

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const router = useRouter();
  const logout = useLogout();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const mustChangePassword = currentUser?.is_temp_password === true;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (mustChangePassword) {
      router.replace("/change-password");
    }
  }, [mustChangePassword, router]);

  if (currentUserQuery.isError) {
    return (
      <div className={styles.shell}>
        <div className={styles.statusScreen} role="alert">
          <CircleAlert size={28} aria-hidden="true" />
          <strong>{t("userLoadError")}</strong>
          <span>{handleApiError(currentUserQuery.error, tApiErrors)}</span>
          <button
            type="button"
            className={styles.statusButton}
            onClick={() => currentUserQuery.refetch()}
          >
            {t("retry")}
          </button>
          {/* Не 401 (например, 403 «школа закрыта») не разлогинивает автоматически. */}
          <button type="button" className={styles.statusLink} onClick={logout}>
            {tCommon("logout")}
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser || mustChangePassword) {
    return (
      <div className={styles.shell}>
        <div className={styles.statusScreen} aria-live="polite">
          <LoaderCircle className={styles.spinner} size={28} aria-hidden="true" />
          <span>{t("loadingUser")}</span>
        </div>
      </div>
    );
  }

  return <AuthenticatedShell currentUser={currentUser}>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({
  currentUser,
  children,
}: {
  currentUser: CurrentUser;
  children: React.ReactNode;
}) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigation = getRoleNavigation(currentUser);
  const mobileItems = getMobileItems(navigation);
  const pathAllowed = isPathAllowed(navigation, pathname);
  const currentItem = getCurrentNavigationItem(navigation, pathname);
  const pageTitle = currentItem ? t(`nav.${currentItem.key}`) : t("title");
  const roleLabel = t(`role.${currentUser.role}`);
  const RoleIcon = currentUser.role === "STUDENT" ? GraduationCap : UserRound;

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const className = `${styles.navItem} ${isActive ? styles.navItemActive : ""}`;
    const content = (
      <>
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{t(`nav.${item.key}`)}</span>
        {!item.available && (
          <small className={styles.comingSoon}>{t("comingSoon")}</small>
        )}
      </>
    );

    if (item.available) {
      return (
        <Link
          key={item.key}
          href={item.href}
          className={className}
          aria-current={isActive ? "page" : undefined}
          onClick={() => setMobileNavOpen(false)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        className={className}
        disabled
        title={t("comingSoon")}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ""}`}
        id="primary-navigation"
      >
        <div className={styles.brand}>
          <Logo theme="dark" />
          <span className={styles.brandDescription}>{t("productDescription")}</span>
        </div>

        <nav className={styles.nav} aria-label={t("navLabel")}>
          <div className={styles.navBlock}>
            <span className={styles.navLabel}>
              {t(`sections.${navigation.sectionKey}`)}
            </span>
            {navigation.items.map(renderNavItem)}
          </div>
        </nav>

        <div className={styles.account}>
          <div className={styles.avatar} aria-hidden="true">
            <RoleIcon size={18} aria-hidden="true" />
          </div>
          <div className={styles.accountMeta}>
            <strong>{currentUser.full_name}</strong>
            <span>{roleLabel}</span>
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            aria-label={tCommon("logout")}
            title={tCommon("logout")}
            onClick={logout}
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
        {currentUser.school && (
          <div className={styles.schoolCard}>
            <span className={styles.schoolCardIcon}>
              <School size={23} aria-hidden="true" />
            </span>
            <span>
              <strong>{currentUser.school.name}</strong>
              {currentUser.school.address && (
                <small>{currentUser.school.address}</small>
              )}
            </span>
          </div>
        )}
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={mobileNavOpen ? t("closeMenu") : t("openMenu")}
              aria-controls="primary-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((value) => !value)}
            >
              {mobileNavOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
            <Logo variant="icon" size="sm" className={styles.headerLogo} />
            <div className={styles.headerContext}>
              <span>{roleLabel}</span>
              <strong>{pageTitle}</strong>
            </div>
            {IS_SEARCH_ENABLED && (
              <label className={styles.searchBox}>
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder={t("search")}
                  aria-label={t("search")}
                />
              </label>
            )}
          </div>

          <div className={styles.headerActions}>
            <div className={styles.langSwitcher}>
              <button
                type="button"
                className={
                  locale === "ky" ? styles.langButtonActive : styles.langButton
                }
                onClick={() => handleLocaleChange("ky")}
              >
                KG
              </button>
              <button
                type="button"
                className={
                  locale === "ru" ? styles.langButtonActive : styles.langButton
                }
                onClick={() => handleLocaleChange("ru")}
              >
                RU
              </button>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              aria-label={t("toggleTheme")}
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                )
              }
            >
              <span className={styles.themeIconLight}>
                <Moon size={17} />
              </span>
              <span className={styles.themeIconDark}>
                <Sun size={17} />
              </span>
            </button>

            <NotificationsMenu />
            <div className={styles.headerProfile}>
              <span className={styles.headerAvatar} aria-hidden="true">
                <RoleIcon size={18} />
              </span>
              <span>
                <strong>{currentUser.full_name}</strong>
                <small>{roleLabel}</small>
              </span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {pathAllowed ? (
            children
          ) : (
            <div className={styles.accessDenied} role="alert">
              <ShieldAlert size={32} aria-hidden="true" />
              <strong>{t("accessDenied.title")}</strong>
              <span>{t("accessDenied.description")}</span>
              <Link href="/" className={styles.statusButton}>
                {t("accessDenied.backHome")}
              </Link>
            </div>
          )}
        </main>
      </div>

      <nav className={styles.mobileNav} aria-label={t("mobileNavLabel")}>
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const className = `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`;

          if (item.available) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className={className}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(`nav.${item.key}`)}</span>
              </Link>
            );
          }

          return (
            <span
              key={item.key}
              className={className}
              aria-disabled="true"
              title={t("comingSoon")}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{t(`nav.${item.key}`)}</span>
            </span>
          );
        })}
      </nav>

      {mobileNavOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label={t("closeMenu")}
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );
}
