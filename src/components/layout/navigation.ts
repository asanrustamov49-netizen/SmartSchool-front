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

// Смысловая группа раздела: в боковом меню и в листе «Ещё» разделы идут блоками
// с подписью (Обзор, Люди, Учёба…), чтобы не искать нужное в длинном списке.
export type NavigationGroup = "overview" | "people" | "learning" | "classroom" | "activity" | "platform";

export type NavigationItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
  group?: NavigationGroup;
};

// Подряд идущие разделы одной группы — для вывода блоками с заголовком.
export function groupNavigationItems(items: NavigationItem[]) {
  const groups: { group: NavigationGroup; items: NavigationItem[] }[] = [];
  for (const item of items) {
    const group = item.group ?? "overview";
    const last = groups[groups.length - 1];
    if (last && last.group === group) {
      last.items.push(item);
    } else {
      groups.push({ group, items: [item] });
    }
  }
  return groups;
}

export type RoleNavigation = {
  sectionKey: string;
  // Разделы бокового меню.
  items: NavigationItem[];
  // Личные страницы из меню аккаунта (профиль, настройки). В боковом меню их нет,
  // но они тоже разрешены для роли и попадают в быстрый поиск.
  accountItems: NavigationItem[];
};

const MOBILE_ITEMS_COUNT = 4;

const homeItem: NavigationItem = {
  key: "home",
  href: "/",
  icon: LayoutDashboard,
  available: true,
  group: "overview",
};

const scheduleItem: NavigationItem = {
  key: "schedule",
  href: "/schedule",
  icon: CalendarClock,
  available: true,
  group: "overview",
};

const ratingsItem: NavigationItem = {
  key: "ratings",
  href: "/ratings",
  icon: ChartNoAxesCombined,
  available: true,
  group: "activity",
};

const announcementsItem: NavigationItem = {
  key: "announcements",
  href: "/announcements",
  icon: Megaphone,
  available: true,
  group: "activity",
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
function getAdminItems(): NavigationItem[] {
  return [
    homeItem,
    scheduleItem,
    { key: "teachers", href: "/admin/teachers", icon: UserRound, available: true, group: "people" },
    { key: "students", href: "/admin/students", icon: GraduationCap, available: true, group: "people" },
    // Завучей добавляет директор; завуч видит список коллег.
    { key: "deputies", href: "/admin/deputies", icon: ShieldCheck, available: true, group: "people" },
    { key: "classes", href: "/admin/classes", icon: School, available: true, group: "learning" },
    { key: "subjects", href: "/admin/subjects", icon: Library, available: true, group: "learning" },
    { key: "journal", href: "/journal", icon: NotebookPen, available: true, group: "learning" },
    // Перевод учеников на новый учебный год: директор и завуч.
    { key: "promotion", href: "/admin/promotion", icon: TrendingUp, available: true, group: "learning" },
    {
      key: "absenceRequests",
      href: "/absence-requests",
      icon: ClipboardCheck,
      available: true,
      group: "activity",
    },
    { key: "olympiad", href: "/admin/olympiad", icon: Medal, available: true, group: "activity" },
    ratingsItem,
    announcementsItem,
  ];
}

const studentItems: NavigationItem[] = [
  homeItem,
  scheduleItem,
  { key: "daily", href: "/diary", icon: BookOpen, available: true, group: "learning" },
  { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true, group: "learning" },
  ratingsItem,
  announcementsItem,
];

// Ученик не может подавать заявки на отсутствие (backend отвечает 403),
// поэтому этот пункт есть только у родителя.
const parentItems: NavigationItem[] = [
  homeItem,
  scheduleItem,
  { key: "daily", href: "/diary", icon: BookOpen, available: true, group: "learning" },
  { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true, group: "learning" },
  { key: "absence", href: "/absence-requests", icon: ClipboardCheck, available: true, group: "learning" },
  ratingsItem,
  announcementsItem,
];

function getTeacherItems(isClassTeacher: boolean): NavigationItem[] {
  const items: NavigationItem[] = [
    homeItem,
    scheduleItem,
    { key: "journal", href: "/journal", icon: NotebookPen, available: true, group: "learning" },
    { key: "assignments", href: "/homeworks", icon: ClipboardList, available: true, group: "learning" },
  ];

  // Классный руководитель определяется не ролью, а привязкой к классу (is_class_teacher).
  if (isClassTeacher) {
    items.push({ key: "myClass", href: "/my-class", icon: Users, available: true, group: "classroom" });
    items.push({
      key: "absenceRequests",
      href: "/absence-requests",
      icon: ClipboardCheck,
      available: true,
      group: "classroom",
    });
  }

  items.push(ratingsItem, announcementsItem);

  return items;
}

export function getRoleNavigation(user: CurrentUser): RoleNavigation {
  const accountItems = [profileItem, settingsItem];

  switch (user.role) {
    case "DIRECTOR":
    case "DEPUTY":
      return {
        sectionKey: "admin",
        items: getAdminItems(),
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
        items: [
          homeItem,
          { key: "schools", href: "/system/schools", icon: School, available: true, group: "platform" },
        ],
        accountItems,
      };
  }
}

// Нижняя панель на телефоне: четыре главных раздела роли и кнопка «Ещё».
export function getMobileItems(navigation: RoleNavigation): NavigationItem[] {
  return navigation.items.filter((item) => item.available).slice(0, MOBILE_ITEMS_COUNT);
}

// Всё, что не поместилось в нижнюю панель, открывается листом «Ещё».
export function getMoreItems(navigation: RoleNavigation): NavigationItem[] {
  const mobileKeys = new Set(getMobileItems(navigation).map((item) => item.key));
  return navigation.items.filter((item) => item.available && !mobileKeys.has(item.key));
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
