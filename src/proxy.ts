import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { getLocaleFromPathname, TOKEN_COOKIE_NAME } from "./lib/auth";

const handleI18nRouting = createMiddleware(routing);

const LANDING_PATH = "/welcome";
const API_PROXY_PREFIX = "/api";
const GUEST_ONLY_PATHS = ["/login", "/register", LANDING_PATH];

function getPathWithoutLocale(pathname: string, locale: string) {
  const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return path === "" ? "/" : path;
}

// Быстрая проверка по наличию cookie. Настоящую проверку токена делает backend:
// при 401 клиент удаляет токен и возвращает пользователя на /login.
// Сайт на Vercel открыт по https, а backend доступен только по http: браузер блокирует
// такие запросы (mixed content). Поэтому в production фронт обращается к /api на своём домене,
// а здесь запрос пересылается на backend из серверной переменной BACKEND_URL.
// Путь пересылается как есть, со слешем на конце: FastAPI различает /subjects и /subjects/.
function proxyToBackend(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json({ detail: "BACKEND_URL is not configured" }, { status: 502 });
  }

  const { pathname, search } = request.nextUrl;
  const backendPath = pathname.slice(API_PROXY_PREFIX.length) || "/";
  return NextResponse.rewrite(new URL(`${backendPath}${search}`, backendUrl));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === API_PROXY_PREFIX || pathname.startsWith(`${API_PROXY_PREFIX}/`)) {
    return proxyToBackend(request);
  }

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
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/api/:path*"],
};
