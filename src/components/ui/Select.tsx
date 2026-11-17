"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Select.module.scss";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  // id связывает поле с <label htmlFor>; без подписи на экране нужен ariaLabel.
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  // Иконка слева в поле (например, книга у выбора предмета).
  icon?: ReactNode;
  size?: "md" | "sm";
  className?: string;
};

// Выпадающий список в стиле приложения вместо системного <select>.
// Системный список браузера нельзя оформить: в тёмной теме он белый, на ноутбуке
// растягивается на всю ширину. Этот открывается компактной карточкой у поля,
// с прокруткой и подсветкой выбранного пункта; клавиатура и скринридеры работают (base-ui).
export function Select({
  value,
  onValueChange,
  options,
  id,
  ariaLabel,
  placeholder,
  disabled,
  invalid,
  icon,
  size = "md",
  className,
}: SelectProps) {
  // Пустая строка — «ничего не выбрано», если среди пунктов нет пункта с пустым значением
  // (как «Все классы» в фильтрах). Тогда в поле видна подсказка placeholder.
  const hasEmptyOption = options.some((option) => option.value === "");
  const selectedValue = value === "" && !hasEmptyOption ? null : value;

  return (
    <SelectPrimitive.Root
      items={options}
      value={selectedValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onValueChange(nextValue);
        }
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(styles.trigger, size === "sm" && styles.small, className)}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <SelectPrimitive.Value className={styles.value} placeholder={placeholder} />
        <SelectPrimitive.Icon className={styles.chevron}>
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className={styles.positioner} sideOffset={6} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup className={styles.popup}>
            <SelectPrimitive.List className={styles.list}>
              {options.map((option) => (
                <SelectPrimitive.Item key={option.value} value={option.value} className={styles.item}>
                  <SelectPrimitive.ItemText className={styles.itemText}>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className={styles.check}>
                    <Check size={15} aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
