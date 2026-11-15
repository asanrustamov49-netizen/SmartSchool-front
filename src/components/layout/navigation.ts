import {
  BookOpen,
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
  UserRound,
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
  items: NavigationItem[];
};

const MOBILE_ITEMS_COUNT = 4;

const homeItem: NavigationItem = {
  key: "home",
  href: "/",
  icon: LayoutDashboard,
  available: true,
};

// Разделы взяты из backend FRONTEND.md («Экраны → эндпоинты»).
// available: true ставится только после того, как страница реально сделана.
const adminItems: NavigationItem[] = [
  homeItem,
  // Список учителей ждёт GET /teachers на backend; создание и импорт уже работают.
  { key: "teachers", href: "/admin/teachers", icon: UserRound, available: true },
  { key: "students", href: "/admin/students", icon: GraduationCap, available: true },
  { key: "classes", href: "/admin/classes", icon: School, available: true },
  { key: "subjects", href: "/admin/subjects", icon: Library, available: true },
  { key: "journal", href: "/journal", icon: NotebookPen },
  { key: "absenceRequests", href: "/absence-requests", icon: ClipboardCheck },
  { key: "olympiad", href: "/admin/olympiad", icon: Medal },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
  { key: "settings", href: "/admin/school", icon: School, available: true },
  { key: "profile", href: "/profile", icon: UserRound, available: true },
];

const studentItems: NavigationItem[] = [
  homeItem,
  { key: "daily", href: "/diary", icon: BookOpen },
  { key: "assignments", href: "/homeworks", icon: ClipboardList },
  { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
  { key: "profile", href: "/profile", icon: UserRound, available: true },
];

// Ученик не может подавать заявки на отсутствие (backend отвечает 403),
// поэтому этот пункт есть только у родителя.
const parentItems: NavigationItem[] = [
  homeItem,
  { key: "daily", href: "/diary", icon: BookOpen },
  { key: "assignments", href: "/homeworks", icon: ClipboardList },
  { key: "absence", href: "/absence-requests", icon: ClipboardCheck },
  { key: "ratings", href: "/ratings", icon: ChartNoAxesCombined, available: true },
  { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
  { key: "profile", href: "/profile", icon: UserRound, available: true },
];

function getTeacherItems(isClassTeacher: boolean): NavigationItem[] {
  const items: NavigationItem[] = [
    homeItem,
    { key: "journal", href: "/journal", icon: NotebookPen },
    { key: "assignments", href: "/homeworks", icon: ClipboardList },
  ];

  // Классный руководитель определяется не ролью, а привязкой к классу (is_class_teacher).
  if (isClassTeacher) {
    items.push({
      key: "absenceRequests",
      href: "/absence-requests",
      icon: ClipboardCheck,
    });
  }

  items.push(
    { key: "announcements", href: "/announcements", icon: Megaphone, available: true },
    { key: "profile", href: "/profile", icon: UserRound, available: true },
  );

  return items;
}

export function getRoleNavigation(user: CurrentUser): RoleNavigation {
  switch (user.role) {
    case "DIRECTOR":
    case "DEPUTY":
      return { sectionKey: "admin", items: adminItems };
    case "TEACHER":
    case "CLASS_TEACHER":
      return {
        sectionKey: "teacher",
        items: getTeacherItems(Boolean(user.is_class_teacher)),
      };
    case "STUDENT":
      return { sectionKey: "student", items: studentItems };
    case "PARENT":
      return { sectionKey: "parent", items: parentItems };
    default:
      // SYSTEM_ADMIN: в API нет отдельных экранов системного администратора.
      return { sectionKey: "system", items: [homeItem] };
  }
}

export function getMobileItems(navigation: RoleNavigation): NavigationItem[] {
  return navigation.items.slice(0, MOBILE_ITEMS_COUNT);
}

export function isPathAllowed(navigation: RoleNavigation, pathname: string) {
  return getCurrentNavigationItem(navigation, pathname) !== undefined;
}

// Пункт меню для текущей страницы: точное совпадение или вложенный путь раздела.
export function getCurrentNavigationItem(
  navigation: RoleNavigation,
  pathname: string,
): NavigationItem | undefined {
  return navigation.items.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
}
