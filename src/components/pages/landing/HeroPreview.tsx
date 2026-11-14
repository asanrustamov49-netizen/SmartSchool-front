import {
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  LayoutDashboard,
  NotebookPen,
  Trophy,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import styles from "./landing.module.scss";

// Иллюстрация интерфейса: без имён и показателей, похожих на реальные данные.
// Ячейки журнала — условные отметки, ширины полос задают только композицию.
const JOURNAL_ROWS = [
  { nameWidth: 72, cells: ["5", "4", "", "5", "", "5"] },
  { nameWidth: 58, cells: ["4", "", "5", "Ж", "4", ""] },
  { nameWidth: 80, cells: ["", "5", "5", "", "5", "4"] },
  { nameWidth: 64, cells: ["5", "", "4", "5", "", "5"] },
  { nameWidth: 52, cells: ["4", "5", "", "4", "С", ""] },
];

const RATING_BARS = [92, 74, 61];

const SIDEBAR_ICONS = [LayoutDashboard, NotebookPen, BookOpen, ChartNoAxesCombined, Users];

function getCellClassName(value: string) {
  if (value === "5") {
    return styles.cellTop;
  }

  if (value === "4") {
    return styles.cellGood;
  }

  if (value === "Ж" || value === "С") {
    return styles.cellMark;
  }

  return styles.cellEmpty;
}

export async function HeroPreview() {
  const t = await getTranslations("landing.preview");

  return (
    <figure className={styles.preview}>
      <div className={styles.previewStage} aria-hidden="true" data-tilt>
        <div className={styles.previewGlow} />

        <div className={styles.previewWindow}>
          <div className={styles.previewSidebar}>
            <span className={styles.previewLogo} />
            {SIDEBAR_ICONS.map((Icon, index) => (
              <span
                key={index}
                className={index === 1 ? styles.previewNavActive : styles.previewNavItem}
              >
                <Icon size={15} strokeWidth={1.9} />
              </span>
            ))}
          </div>

          <div className={styles.previewMain}>
            <div className={styles.previewTopbar}>
              <strong>{t("journal")}</strong>
              <span className={styles.previewChips}>
                <span className={styles.previewChipActive} />
                <span className={styles.previewChip} />
                <span className={styles.previewChip} />
              </span>
            </div>

            <div className={styles.journal}>
              <div className={styles.journalHead}>
                <span className={styles.skeletonShort} />
                {JOURNAL_ROWS[0].cells.map((_, index) => (
                  <span key={index} className={styles.journalDay} />
                ))}
              </div>
              {JOURNAL_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.journalRow}>
                  <span className={styles.journalName}>
                    <span className={styles.journalAvatar} />
                    <span
                      className={styles.skeleton}
                      style={{ width: `${row.nameWidth}%` }}
                    />
                  </span>
                  {row.cells.map((value, index) => (
                    <span
                      key={index}
                      className={`${styles.journalCell} ${getCellClassName(value)}`}
                      style={{ "--cell-index": rowIndex * row.cells.length + index } as CSSProperties}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${styles.floatCard} ${styles.ratingCard}`}>
          <div className={styles.floatTitle}>
            <Trophy size={15} />
            {t("rating")}
          </div>
          {RATING_BARS.map((width, index) => (
            <div key={width} className={styles.ratingRow}>
              <span className={`${styles.ratingPlace} ${styles[`place${index + 1}`]}`}>
                {index + 1}
              </span>
              <span className={styles.ratingTrack}>
                <span style={{ width: `${width}%` }} />
              </span>
            </div>
          ))}
        </div>

        <div className={`${styles.floatCard} ${styles.notifyCard}`}>
          <span className={styles.notifyIcon}>
            <Bell size={15} />
          </span>
          <span>
            <strong>{t("notificationTitle")}</strong>
            <span className={styles.skeletonShort} />
          </span>
        </div>
      </div>
      <figcaption className={styles.previewCaption}>{t("caption")}</figcaption>
    </figure>
  );
}
