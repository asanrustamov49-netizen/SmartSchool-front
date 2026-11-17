"use client";

import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./RowActions.module.scss";

export type RowAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type RowActionsProps = {
  // Главное действие строки — видно всегда (обычно «Изменить»).
  primary?: RowAction;
  // Остальные действия — в меню «⋯». Одно действие показывается кнопкой рядом.
  actions?: RowAction[];
  // Подпись кнопки «⋯» для скринридеров, например «Действия: Иванова Мария».
  menuLabel: string;
};

function ActionButton({ action }: { action: RowAction }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      className={cn(styles.button, action.danger && styles.danger)}
      disabled={action.disabled}
      onClick={action.onSelect}
    >
      <Icon size={15} aria-hidden="true" />
      <span>{action.label}</span>
    </button>
  );
}

// Действия строки таблицы или карточки: одна видимая кнопка и аккуратное меню «⋯»
// вместо ряда цветных ссылок, из-за которых таблица уезжала вбок.
// Опасные действия (отключить, удалить) — внизу меню, красным и через разделитель.
export function RowActions({ primary, actions = [], menuLabel }: RowActionsProps) {
  const regular = actions.filter((action) => !action.danger);
  const dangerous = actions.filter((action) => action.danger);

  return (
    <div className={styles.actions}>
      {primary && <ActionButton action={primary} />}

      {actions.length === 1 && <ActionButton action={actions[0]} />}

      {actions.length > 1 && (
        <Menu.Root>
          <Menu.Trigger className={styles.more} aria-label={menuLabel}>
            <MoreHorizontal size={18} aria-hidden="true" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.positioner} sideOffset={6} align="end">
              <Menu.Popup className={styles.popup}>
                {regular.map((action) => (
                  <MenuItem key={action.label} action={action} />
                ))}
                {regular.length > 0 && dangerous.length > 0 && <Menu.Separator className={styles.separator} />}
                {dangerous.map((action) => (
                  <MenuItem key={action.label} action={action} />
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  );
}

function MenuItem({ action }: { action: RowAction }) {
  const Icon = action.icon;
  return (
    <Menu.Item
      className={cn(styles.item, action.danger && styles.itemDanger)}
      disabled={action.disabled}
      onClick={action.onSelect}
    >
      <Icon size={16} aria-hidden="true" />
      {action.label}
    </Menu.Item>
  );
}
