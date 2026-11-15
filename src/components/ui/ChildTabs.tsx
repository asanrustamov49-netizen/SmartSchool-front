"use client";

import type { ParentChild } from "@/apis/auth.api";
import { cn } from "@/lib/utils";
import styles from "./ChildTabs.module.scss";

type ChildTabsProps = {
  childrenList: ParentChild[];
  selectedId: number | null;
  onSelect: (childId: number) => void;
  label: string;
};

// Переключатель ребёнка для родителя. С одним ребёнком не показывается.
export function ChildTabs({ childrenList, selectedId, onSelect, label }: ChildTabsProps) {
  if (childrenList.length < 2) {
    return null;
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {childrenList.map((child) => (
        <button
          key={child.id}
          type="button"
          role="tab"
          aria-selected={child.id === selectedId}
          className={cn(styles.tab, child.id === selectedId && styles.tabActive)}
          onClick={() => onSelect(child.id)}
        >
          {child.full_name}
          {child.class_name ? ` · ${child.class_name}` : ""}
        </button>
      ))}
    </div>
  );
}
