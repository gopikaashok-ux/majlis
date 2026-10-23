import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent } from "react";
import spinnerIcon from "./icons/spinner.svg";
import styles from "./Button.module.css";

export type ButtonVariant = "primary";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** URL of an icon SVG shown before the label; rendered as a mask so it takes the button's text colour. */
  leadingIcon?: string;
  /** URL of an icon SVG shown after the label. */
  trailingIcon?: string;
  /** State=Loading: the leading icon becomes a spinner and clicks are ignored; the button stays focusable. */
  loading?: boolean;
}

const icon = (url: string) => ({ "--btn-icon": `url("${url}")` }) as CSSProperties;

/**
 * Button — Variant=Primary, Size=Small | Medium | Large,
 * State=Default | Hover | Focus | Pressed | Disabled | Loading (Figma component set 481:10750).
 *
 * Hover, Pressed and Focus come from :hover, :active and :focus-visible. For static previews a
 * state can be forced with `data-state="hover" | "pressed" | "focus"`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "medium",
    leadingIcon,
    trailingIcon,
    loading = false,
    disabled,
    type = "button",
    className,
    onClick,
    children,
    ...rest
  },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading ? (
        <span className={`${styles.icon} ${styles.spinner}`} style={icon(spinnerIcon)} aria-hidden="true" />
      ) : (
        leadingIcon && <span className={styles.icon} style={icon(leadingIcon)} aria-hidden="true" />
      )}
      <span className={styles.label}>{children}</span>
      {trailingIcon && <span className={styles.icon} style={icon(trailingIcon)} aria-hidden="true" />}
    </button>
  );
});
