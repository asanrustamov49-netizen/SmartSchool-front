import { routing } from "@/i18n/routing";

// Backend принимает токен только в заголовке Authorization: Bearer.
// Токен хранится в cookie, чтобы proxy.ts мог перенаправить гостя на /login
// ещё до загрузки страницы. Refresh-токена у backend нет: срок жизни access-токена
// задаёт backend (ACCESS_TOKEN_EXPIRE_MINUTES), после 401 нужно войти заново.
export const TOKEN_COOKIE_NAME = "smart-school-token";

const TOKEN_MAX_AGE_SECONDS = 12 * 60 * 60;

export function getToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${TOKEN_COOKIE_NAME}=`));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.split("=")[1]);
}

export function saveToken(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function removeToken() {
  document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getLocaleFromPathname(pathname: string): string {
  const firstSegment = pathname.split("/")[1];
  const isKnownLocale = routing.locales.some((locale) => locale === firstSegment);

  return isKnownLocale ? firstSegment : routing.defaultLocale;
}

export function redirectToLogin() {
  const locale = getLocaleFromPathname(window.location.pathname);
  window.location.replace(`/${locale}/login`);
}
