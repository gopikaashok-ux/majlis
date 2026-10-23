import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import chevronIcon from "./icons/arrow-down-01.svg";
import styles from "./TabBar.module.css";

export interface TabBarItem {
  value: string;
  label: string;
  /** URL of a 20×20 icon SVG. It is rendered as a mask, so it takes the tab's state color. */
  icon: string;
  /** Shows the trailing chevron (Figma: Tab Item "Chevron" property, e.g. "More ▾"). */
  chevron?: boolean;
}

export interface TabBarProps {
  items: TabBarItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * Tab Bar — Style=Icon Tabs (Figma node 580:1841).
 * Tabs are "Tab Item / Glass" Style=Icon (Default / Hover / Active).
 */
export function TabBar({
  items,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  className,
}: TabBarProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.value);
  const selected = value ?? uncontrolled;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const select = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    tabRefs.current[target]?.focus();
    select(items[target].value);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={[styles.bar, className].filter(Boolean).join(" ")}
    >
      {items.map((item, index) => {
        const isActive = item.value === selected;
        return (
          <button
            key={item.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`${baseId}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={styles.tab}
            onClick={() => select(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span
              aria-hidden="true"
              className={styles.icon}
              style={{ "--tab-icon": `url("${item.icon}")` } as CSSProperties}
            />
            <span className={styles.labelRow}>
              <span className={styles.label}>{item.label}</span>
              {item.chevron && (
                <span
                  aria-hidden="true"
                  className={styles.chevron}
                  style={{ "--tab-icon": `url("${chevronIcon}")` } as CSSProperties}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
