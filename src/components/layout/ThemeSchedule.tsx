"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useFlag } from "@/hooks/useAppearance";

export const DARK_FROM_HOUR = 20;
export const DARK_UNTIL_HOUR = 7;
const CHECK_INTERVAL_MS = 60 * 1000;

function getScheduledTheme() {
  const hour = new Date().getHours();
  return hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR ? "dark" : "light";
}

// Настройка «Тема по времени»: тёмная с 20:00 до 7:00, днём светлая. Проверка раз в минуту.
export function ThemeSchedule() {
  const isOn = useFlag("scheduledTheme");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isOn) {
      return;
    }
    const applyTheme = () => {
      const scheduled = getScheduledTheme();
      if (theme !== scheduled) {
        setTheme(scheduled);
      }
    };
    applyTheme();
    const timer = window.setInterval(applyTheme, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isOn, theme, setTheme]);

  return null;
}
