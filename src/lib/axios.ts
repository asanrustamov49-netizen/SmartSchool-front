import axios from "axios";
import { resetAppearance } from "./appearance";
import { getToken, redirectToLogin, removeToken } from "./auth";

const LOGIN_URL = "/auth/login";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // 401 на /auth/login — это неверный ИНН или пароль, а не истёкшая сессия.
      // /auth/first-login-change на неверный пароль отвечает 400, поэтому его 401 — истёкший токен.
      const isSessionExpired =
        error.response?.status === 401 && error.config?.url !== LOGIN_URL;

      if (isSessionExpired && typeof window !== "undefined") {
        removeToken();
        resetAppearance();
        redirectToLogin();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
