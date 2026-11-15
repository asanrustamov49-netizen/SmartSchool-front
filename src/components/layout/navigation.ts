import {
  BookOpen,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Library,
  Medal,
  Megaphone,
  NotebookPen,
  School,
  ShieldCheck,
  Settings2,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CurrentUser } from "@/apis/auth.api";

export type NavigationItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
};

export type RoleNavigation = {
  sectionKey: string;
  // Разделы бокового меню.
  items: NavigationItem[];
  // Личные страницы из меню аккаунта (профиль, настройки). В боковом меню их нет,
  // но они тоже разрешены для роли и попадают в быстрый поиск.
  accountItems: NavigationItem[];
};

const MOBILE_ITEMS_COUNT = 5;

const homeItem: NavigationItem = {
  key: "home",
  href: "/",
  icon: LayoutDashboard,
  available: true,
};

const scheduleItem: NavigationItem = {
  key: "schedule",
  href: "/schedule",
  icon: CalendarClock,
  available: true,
};

const profileItem: NavigationItem = {
  key: "profile",
  href: "/profile",
  icon: UserRound,
  available: true,
};

const settingsItem: NavigationItem = {
  key: "settings",
  href: "/settings",
  icon: Settings2,
  available: true,
};

const schoolSettingsItem: NavigationItem = {
  key: "schoolSettings",
  href: "/admin/school",
  icon: School,
  available: true,
};

// Разделы взяты из backend FRONTEND.md («Экраны → эндпоинты»).
// available: true ставится только после того, как страница реально сделана.
const adminItems: NavigationItem[] = [
  homeItem,
  scheduleItem,
  { key: "teachers", href: "/admin/teachers", icon: UserRound, available: true },
  { key: "students", href: "/admin/students", icon: GraduationCap, available: true },
  { key: "classes", href: "/admin/classes", icon: School, available: true },
  { key: "subjects", href: "/admin/subjects", icon: Library, available: true },
  // Завучей добавляет директор; завуч видит список коллег.
  { key: "deputies", href: "/admin/deputies", icon: ShieldCheck, available: true },
  { key: "journal", href: "/journal", icon: NotebookPen, available: true },
  { key: "absenceRequests", href: "/absence-requests", icon: ClipboardCheck, available: true },
  { key: "olympiad", href: "/admin/olympiad", icon: Medal, available: true },
  { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
];

const studentItems: NavigationItem[] = [
  homeItem,
  scheduleItem,
  { key: "daily", href: "/diary", icon: BookOpen, available: true },
  { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true },
  { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
];

// Ученик не может подавать заявки на отсутствие (backend отвечает 403),
// поэтому этот пункт есть только у родителя.
const parentItems: NavigationItem[] = [
  homeItem,
  scheduleItem,
  { key: "daily", href: "/diary", icon: BookOpen, available: true },
  { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true },
  { key: "absence", href: "/absence-requests", icon: ClipboardCheck, available: true },
  { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
];

// Перевод учеников на новый учебный год backend разрешает только директору.
const promotionItem: NavigationItem = {
  key: "promotion",
  href: "/admin/promotion",
  icon: TrendingUp,
  available: true,
};

function getTeacherItems(isClassTeacher: boolean): NavigationItem[] {
  const items: NavigationItem[] = [
    homeItem,
    scheduleItem,
    { key: "journal", href: "/journal", icon: NotebookPen, available: true },
    { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true },
  ];

  // Классный руководитель определяется не ролью, а привязкой к классу (is_class_teacher).
  if (isClassTeacher) {
    items.push({ key: "myClass", href: "/my-class", icon: Users, available: true });
    items.push({
      key: "absenceRequests",
      href: "/absence-requests",
      icon: ClipboardCheck,
      available: true,
    });
  }

  items.push(
    { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
    { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
  );

  return items;
}

export function getRoleNavigation(user: CurrentUser): RoleNavigation {
  const accountItems = [profileItem, settingsItem];

  switch (user.role) {
    case "DIRECTOR":
    case "DEPUTY":
      return {
        sectionKey: "admin",
        items: user.role === "DIRECTOR" ? [...adminItems, promotionItem] : adminItems,
        accountItems: [profileItem, schoolSettingsItem, settingsItem],
      };
    case "TEACHER":
    case "CLASS_TEACHER":
      return {
        sectionKey: "teacher",
        items: getTeacherItems(Boolean(user.is_class_teacher)),
        accountItems,
      };
    case "STUDENT":
      return { sectionKey: "student", items: studentItems, accountItems };
    case "PARENT":
      return { sectionKey: "parent", items: parentItems, accountItems };
    default:
      // SYSTEM_ADMIN управляет школами платформы, а не данными одной школы.
      return {
        sectionKey: "system",
        items: [homeItem, { key: "schools", href: "/system/schools", icon: School, available: true }],
        accountItems,
      };
  }
}

// Нижняя панель на телефоне: готовые разделы, затем профиль, всего не больше пяти.
// Разделы «Скоро» остаются только в боковом меню.
export function getMobileItems(navigation: RoleNavigation): NavigationItem[] {
  return [...navigation.items.filter((item) => item.available), profileItem].slice(
    0,
    MOBILE_ITEMS_COUNT,
  );
}

// Все страницы, доступные роли: для проверки доступа, заголовка и быстрого поиска.
export function getAllowedItems(navigation: RoleNavigation): NavigationItem[] {
  return [...navigation.items, ...navigation.accountItems].filter((item) => item.available);
}

export function isPathAllowed(navigation: RoleNavigation, pathname: string) {
  return getCurrentNavigationItem(navigation, pathname) !== undefined;
}

// Пункт меню для текущей страницы: точное совпадение или вложенный путь раздела.
export function getCurrentNavigationItem(
  navigation: RoleNavigation,
  pathname: string,
): NavigationItem | undefined {
  return getAllowedItems(navigation).find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
}
