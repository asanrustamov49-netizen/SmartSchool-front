"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { RowAction } from "./RowActions";
import styles from "./RowActions.module.scss";

type ActionsMenuProps = {
  label: string;
  icon: LucideIcon;
  actions: RowAction[];
  triggerClassName?: string;
};

// Кнопка с выпадающим списком действий — например, «Excel ▾» на телефоне вместо трёх кнопок.
export function ActionsMenu({ label, icon: Icon, actions, triggerClassName }: ActionsMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className={triggerClassName}>
        <Icon size={16} aria-hidden="true" />
        {label}
        <ChevronDown size={16} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.positioner} sideOffset={6} align="start">
          <Menu.Popup className={styles.popup}>
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Menu.Item
                  key={action.label}
                  className={styles.item}
                  disabled={action.disabled}
                  onClick={action.onSelect}
                >
                  <ActionIcon size={16} aria-hidden="true" />
                  {action.label}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
