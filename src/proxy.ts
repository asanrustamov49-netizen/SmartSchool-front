import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { getLocaleFromPathname, TOKEN_COOKIE_NAME } from "./lib/auth";

const handleI18nRouting = createMiddleware(routing);

const LANDING_PATH = "/welcome";
const GUEST_ONLY_PATHS = ["/login", "/register", LANDING_PATH];

function getPathWithoutLocale(pathname: string, locale: string) {
  const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return path === "" ? "/" : path;
}

// Быстрая проверка по наличию cookie. Настоящую проверку токена делает backend:
// при 401 клиент удаляет токен и возвращает пользователя на /login.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);
  const path = getPathWithoutLocale(pathname, locale);
  const hasToken = request.cookies.has(TOKEN_COOKIE_NAME);
  const isGuestOnlyPath = GUEST_ONLY_PATHS.includes(path);

  // Гость, открывший сайт, сначала видит Landing, а не форму входа.
  if (!hasToken && path === "/") {
    return NextResponse.redirect(new URL(`/${locale}${LANDING_PATH}`, request.url));
  }

  if (!hasToken && !isGuestOnlyPath) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (hasToken && isGuestOnlyPath) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
