"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  CircleAlert,
  LoaderCircle,
  LayoutGrid,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Search,
  ShieldAlert,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { CurrentUser } from "@/apis/auth.api";
import { Logo } from "@/components/ui/Logo";
import { Toaster } from "@/components/ui/Toaster";
import { useSidebarCollapsed } from "@/hooks/useAppearance";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { useNavIndicator } from "@/hooks/useNavIndicator";
import { applySavedAppearance, setSidebarCollapsed } from "@/lib/appearance";
import { handleApiError } from "@/lib/errorHandler";
import { cn, getMediaUrl } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { MobileMoreSheet } from "./MobileMoreSheet";
import { CabinetSpotlight } from "./CabinetSpotlight";
import { SidebarTooltip } from "./SidebarTooltip";
import { CommandPalette } from "./CommandPalette";
import {
  getAllowedItems,
  getCurrentNavigationItem,
  getMobileItems,
  groupNavigationItems,
  getMoreItems,
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
  // Лист «Ещё» на телефоне и планшете — там все остальные разделы, профиль, язык и выход.
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const navigation = getRoleNavigation(currentUser);
  const mobileItems = getMobileItems(navigation);
  const moreItems = getMoreItems(navigation);

  // В нижней панели мало места: короткая подпись раздела, если она есть (app.navShort).
  const getMobileLabel = (key: string) => (t.has(`navShort.${key}`) ? t(`navShort.${key}`) : t(`nav.${key}`));
  const pathAllowed = isPathAllowed(navigation, pathname);
  const currentItem = getCurrentNavigationItem(navigation, pathname);
  // «Ещё» подсвечивается, когда открыт раздел, которого нет в нижней панели (журнал, профиль…).
  const isMoreActive = !mobileItems.some((item) => item.key === currentItem?.key);
  // Открыт раздел из «Ещё» — на кнопке его иконка и название, чтобы было видно, где ты.
  const MoreIcon = isMoreActive && currentItem ? currentItem.icon : LayoutGrid;
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

  // Клавиша [ сворачивает и разворачивает боковое меню на компьютере (как в Linear, Notion).
  // event.code, а не event.key: на русской раскладке эта клавиша — «х».
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
      const isDesktop = window.matchMedia("(min-width: 1025px)").matches;

      if (event.code === "BracketLeft" && !isTyping && !hasModifier && isDesktop) {
        event.preventDefault();
        setSidebarCollapsed(!collapsed);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed]);

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
          aria-label={label}
          data-tooltip={collapsed ? label : undefined}
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
        aria-label={`${label} · ${t("comingSoon")}`}
        data-tooltip={collapsed ? `${label} · ${t("comingSoon")}` : undefined}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={styles.shell}>
      <CabinetSpotlight />
      <aside
        className={styles.sidebar}
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
            data-tooltip={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            data-tooltip-shortcut="["
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
            <span className={styles.navIndicator} ref={indicatorRef} aria-hidden="true" />
            {/* Разделы блоками с подписью: Обзор, Люди, Учёба… — так проще найти нужное. */}
            {groupNavigationItems(navigation.items).map(({ group, items }) => (
              <div key={group} className={styles.navGroup} role="group" aria-label={t(`groups.${group}`)}>
                <span className={styles.navLabel} aria-hidden="true">
                  {t(`groups.${group}`)}
                </span>
                {items.map(renderNavItem)}
              </div>
            ))}
          </div>
        </nav>

        <AccountMenu
          currentUser={currentUser}
          items={navigation.accountItems}
          collapsed={collapsed}
          onNavigate={() => setMoreOpen(false)}
        />
        {currentUser.school && (
          <div className={styles.schoolCard} data-tooltip={collapsed ? currentUser.school.name : undefined}>
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
      <SidebarTooltip containerId="primary-navigation" />

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
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
              className={cn(styles.iconButton, styles.themeToggle)}
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
              <span className={styles.mobileNavIcon} aria-hidden="true">
                <Icon size={22} strokeWidth={isActive ? 2.1 : 1.7} />
              </span>
              <span className={styles.mobileNavLabel}>{getMobileLabel(item.key)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={cn(styles.mobileNavItem, isMoreActive && styles.mobileNavItemActive)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <span className={styles.mobileNavIcon} aria-hidden="true">
            <MoreIcon size={22} strokeWidth={isMoreActive ? 2.1 : 1.7} />
          </span>
          <span className={styles.mobileNavLabel}>
            {isMoreActive && currentItem ? getMobileLabel(currentItem.key) : t("more")}
          </span>
        </button>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        currentUser={currentUser}
        items={moreItems}
        accountItems={navigation.accountItems}
        activeKey={currentItem?.key}
      />

      {paletteOpen && (
        <CommandPalette pages={getAllowedItems(navigation)} onClose={() => setPaletteOpen(false)} />
      )}
      <Toaster />
    </div>
  );
}
