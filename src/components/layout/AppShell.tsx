"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  CircleAlert,
  LoaderCircle,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Search,
  ShieldAlert,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { Logo } from "@/components/ui/Logo";
import { useSidebarCollapsed } from "@/hooks/useAppearance";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { useNavIndicator } from "@/hooks/useNavIndicator";
import { applySavedAppearance, setSidebarCollapsed } from "@/lib/appearance";
import { handleApiError } from "@/lib/errorHandler";
import { cn, getMediaUrl } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { CabinetSpotlight } from "./CabinetSpotlight";
import { CommandPalette } from "./CommandPalette";
import {
  getAllowedItems,
  getCurrentNavigationItem,
  getMobileItems,
  getRoleNavigation,
  isPathAllowed,
  type NavigationItem,
} from "./navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import styles from "./app-shell.module.scss";

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
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const collapsed = useSidebarCollapsed();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const navigation = getRoleNavigation(currentUser);
  const mobileItems = getMobileItems(navigation);
  const pathAllowed = isPathAllowed(navigation, pathname);
  const currentItem = getCurrentNavigationItem(navigation, pathname);
  const pageTitle = currentItem ? t(`nav.${currentItem.key}`) : t("title");
  const roleLabel = t(`role.${currentUser.role}`);
  const { listRef, indicatorRef } = useNavIndicator(currentItem?.key, collapsed ? "collapsed" : "expanded");

  useEffect(() => {
    applySavedAppearance();
  }, []);

  // Ctrl+K / ⌘K открывает быстрый поиск с любой страницы кабинета.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    // Вложенные страницы (например, карточка школы) подсвечивают свой раздел.
    const isActive = currentItem?.key === item.key;
    const label = t(`nav.${item.key}`);
    const className = cn(styles.navItem, isActive && styles.navItemActive);
    const content = (
      <>
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className={styles.navText}>{label}</span>
        {!item.available && <small className={styles.comingSoon}>{t("comingSoon")}</small>}
      </>
    );

    if (item.available) {
      return (
        <Link
          key={item.key}
          href={item.href}
          className={className}
          aria-current={isActive ? "page" : undefined}
          title={collapsed ? label : undefined}
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
        title={`${label} · ${t("comingSoon")}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={styles.shell}>
      <CabinetSpotlight />
      <aside
        className={cn(styles.sidebar, mobileNavOpen && styles.sidebarOpen)}
        id="primary-navigation"
      >
        <div className={styles.sidebarGlow} aria-hidden="true" />
        <div className={styles.brand}>
          <Logo theme="dark" size="sm" className={styles.brandFull} />
          <Logo variant="icon" className={styles.brandCompact} />
          <span className={styles.brandDescription}>{t("productDescription")}</span>
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            onClick={() => setSidebarCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={17} aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className={styles.nav} aria-label={t("navLabel")}>
          <div className={styles.navBlock} ref={listRef}>
            <span className={styles.navLabel}>{t(`sections.${navigation.sectionKey}`)}</span>
            <span className={styles.navIndicator} ref={indicatorRef} aria-hidden="true" />
            {navigation.items.map(renderNavItem)}
          </div>
        </nav>

        <AccountMenu
          currentUser={currentUser}
          items={navigation.accountItems}
          collapsed={collapsed}
          onNavigate={() => setMobileNavOpen(false)}
        />
        {currentUser.school && (
          <div className={styles.schoolCard} title={collapsed ? currentUser.school.name : undefined}>
            <span className={styles.schoolCardIcon}>
              {currentUser.school.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- файл лежит на сервере API
                <img src={getMediaUrl(currentUser.school.logo_url)} alt="" />
              ) : (
                <School size={21} aria-hidden="true" />
              )}
            </span>
            <span className={styles.schoolCardText}>
              <strong>{currentUser.school.name}</strong>
              {currentUser.school.address && <small>{currentUser.school.address}</small>}
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
              {mobileNavOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <Logo variant="icon" size="sm" className={styles.headerLogo} />
            <div className={styles.headerContext}>
              <span>{roleLabel}</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.searchTrigger}
            aria-label={t("search.title")}
            onClick={() => setPaletteOpen(true)}
          >
            <Search size={16} aria-hidden="true" />
            <span className={styles.searchText}>{t("search.trigger")}</span>
            <kbd className={styles.searchKbd}>Ctrl K</kbd>
          </button>

          <div className={styles.headerActions}>
            <div className={styles.langSwitcher}>
              <button
                type="button"
                className={locale === "ky" ? styles.langButtonActive : styles.langButton}
                onClick={() => handleLocaleChange("ky")}
              >
                KG
              </button>
              <button
                type="button"
                className={locale === "ru" ? styles.langButtonActive : styles.langButton}
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
                setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
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
          const isActive = currentItem?.key === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(styles.mobileNavItem, isActive && styles.mobileNavItemActive)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
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

      {paletteOpen && (
        <CommandPalette pages={getAllowedItems(navigation)} onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  );
}
