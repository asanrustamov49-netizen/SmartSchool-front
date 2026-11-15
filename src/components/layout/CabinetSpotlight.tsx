"use client";

import { useSpotlight } from "@/hooks/useSpotlight";
import adminStyles from "../pages/admin/admin.module.scss";
import diaryStyles from "../pages/diary/diary.module.scss";
import homeStyles from "../pages/home/home.module.scss";
import homeworkStyles from "../pages/homeworks/homeworks.module.scss";

// Блоки кабинета, по которым свет следует за курсором.
// Баннер главной (DashboardHero) отмечен в разметке как data-spotlight="layer".
const SPOTLIGHT_SELECTOR = [
  "[data-spotlight]",
  adminStyles.card,
  homeStyles.panel,
  homeStyles.metric,
  homeStyles.childCard,
  homeStyles.progressCard,
  homeStyles.classCard,
  diaryStyles.summaryCard,
  diaryStyles.day,
  homeworkStyles.card,
]
  .map((selector) => (selector.startsWith("[") ? selector : `.${selector}`))
  .join(", ");

export function CabinetSpotlight() {
  useSpotlight(SPOTLIGHT_SELECTOR);
  return null;
}
