"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import styles from "./app-shell.module.scss";

// Событие, которым любая страница (например, настройки) открывает это окно.
export const OPEN_SHORTCUTS_EVENT = "smart-school-shortcuts";

const SHORTCUTS = [
  { key: "search", keys: ["Ctrl", "K"] },
  { key: "sidebar", keys: ["["] },
  { key: "help", keys: ["?"] },
] as const;

type ShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Список горячих клавиш, как в Gmail, GitHub и Linear: открывается клавишей «?».
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const t = useTranslations("app.shortcuts");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ul className={styles.shortcuts}>
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.key}>
              <span>{t(`items.${shortcut.key}`)}</span>
              <span className={styles.shortcutKeys}>
                {shortcut.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
