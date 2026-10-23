import { useState, type CSSProperties, type MouseEvent } from "react";
import collapseIcon from "./icons/arrow-left-double.svg";
import chevronIcon from "./icons/arrow-right-01.svg";
import expandIcon from "./icons/arrow-right-double.svg";
import sparklesIcon from "./icons/sparkles.svg";
import styles from "./Sidebar.module.css";

export interface SidebarNavItem {
  id: string;
  label: string;
  /** URL of a 20×20 icon SVG; rendered as a mask so it takes the item's state colour. */
  icon: string;
  /** Small pill after the label, e.g. "New" (hidden when collapsed). */
  badge?: string;
  /** Renders the item as a link; otherwise it is a button. */
  href?: string;
}

export interface SidebarUser {
  name: string;
  plan?: string;
  initials: string;
}

export interface SidebarProps {
  /** Groups of items; a divider is drawn between groups. */
  sections: SidebarNavItem[][];
  activeId?: string;
  defaultActiveId?: string;
  onNavigate?: (id: string, event: MouseEvent) => void;
  brandName?: string;
  user?: SidebarUser;
  onUserClick?: () => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

const icon = (url: string) => ({ "--sb-icon": `url("${url}")` }) as CSSProperties;

/**
 * Sidebar — Style=Glass, Mode=Expanded | Collapsed (Figma 587:1937 / 587:2043, frame 1501:4459).
 * Built from Sidebar Item — Style=Glass, State=Default | Hover | Active.
 */
export function Sidebar({
  sections,
  activeId,
  defaultActiveId,
  onNavigate,
  brandName = "Majlis AI",
  user,
  onUserClick,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  "aria-label": ariaLabel = "Main",
  className,
  style,
}: SidebarProps) {
  const [ownActive, setOwnActive] = useState(defaultActiveId ?? sections[0]?.[0]?.id);
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const current = activeId ?? ownActive;
  const isCollapsed = collapsed ?? ownCollapsed;

  const toggle = () => {
    if (collapsed === undefined) setOwnCollapsed(!isCollapsed);
    onCollapsedChange?.(!isCollapsed);
  };

  const navigate = (id: string, event: MouseEvent) => {
    if (activeId === undefined) setOwnActive(id);
    onNavigate?.(id, event);
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={[styles.sidebar, className].filter(Boolean).join(" ")}
      data-mode={isCollapsed ? "collapsed" : "expanded"}
      style={style}
    >
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          <span className={styles.icon16} style={icon(sparklesIcon)} />
        </span>
        {!isCollapsed && <span className={styles.brandName}>{brandName}</span>}
        <button
          type="button"
          className={styles.toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          onClick={toggle}
        >
          <span className={styles.icon16} style={icon(isCollapsed ? expandIcon : collapseIcon)} aria-hidden="true" />
        </button>
      </div>

      {sections.map((items, index) => (
        <SectionGroup
          key={index}
          items={items}
          withDivider={index > 0}
          current={current}
          collapsed={isCollapsed}
          onNavigate={navigate}
        />
      ))}

      <div className={styles.spacer} />

      {user &&
        (isCollapsed ? (
          <button
            type="button"
            className={styles.avatarButton}
            aria-label={`${user.name}${user.plan ? `, ${user.plan}` : ""}`}
            title={user.name}
            onClick={onUserClick}
          >
            <Avatar initials={user.initials} />
          </button>
        ) : (
          <button type="button" className={styles.profile} onClick={onUserClick}>
            <Avatar initials={user.initials} />
            <span className={styles.who}>
              <span className={styles.userName}>{user.name}</span>
              {user.plan && <span className={styles.userPlan}>{user.plan}</span>}
            </span>
            <span className={styles.icon20} style={icon(chevronIcon)} aria-hidden="true" />
          </button>
        ))}
    </nav>
  );
}

function SectionGroup({
  items,
  withDivider,
  current,
  collapsed,
  onNavigate,
}: {
  items: SidebarNavItem[];
  withDivider: boolean;
  current?: string;
  collapsed: boolean;
  onNavigate: (id: string, event: MouseEvent) => void;
}) {
  return (
    <>
      {withDivider && <hr className={styles.divider} />}
      <ul className={styles.group}>
        {items.map((item) => {
          const isActive = item.id === current;
          const content = (
            <>
              <span className={styles.icon20} style={icon(item.icon)} aria-hidden="true" />
              {!collapsed && <span className={styles.label}>{item.label}</span>}
              {!collapsed && item.badge && <span className={styles.badge}>{item.badge}</span>}
            </>
          );
          const common = {
            className: styles.item,
            "aria-current": isActive ? ("page" as const) : undefined,
            "aria-label": collapsed ? item.label : undefined,
            title: collapsed ? item.label : undefined,
            onClick: (event: MouseEvent) => onNavigate(item.id, event),
          };
          return (
            <li key={item.id} className={styles.groupItem}>
              {item.href ? (
                <a href={item.href} {...common}>
                  {content}
                </a>
              ) : (
                <button type="button" {...common}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Avatar — State=Initials, Size=40 (Figma 344:10591). */
function Avatar({ initials }: { initials: string }) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {initials}
    </span>
  );
}
