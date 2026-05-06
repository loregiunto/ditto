import Link from "next/link";
import type { ReactNode, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Brand
   ============================================================ */
export function DsBrand({ href = "/" }: { href?: string }) {
  return (
    <Link className="ds-brand" href={href}>
      <span className="ds-brand-mark">H</span>
      <span className="ds-brand-name">
        Home<em>Rest</em>
      </span>
    </Link>
  );
}

/* ============================================================
   Topnav
   ============================================================ */
export function DsTopnav({
  rightSlot,
  brandHref = "/",
  showHostMode = true,
}: {
  rightSlot?: ReactNode;
  brandHref?: string;
  showHostMode?: boolean;
}) {
  return (
    <header className="ds-topnav">
      <div className="ds-topnav-inner">
        <DsBrand href={brandHref} />
        {showHostMode && (
          <span className="ds-mode-chip" aria-label="Modalità host">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              aria-hidden="true"
            >
              <path d="M3 12l9-9 9 9M5 10v10h14V10" />
            </svg>
            Modalità host
          </span>
        )}
        {rightSlot ? (
          <div className="ds-topnav-actions">{rightSlot}</div>
        ) : null}
      </div>
    </header>
  );
}

/* ============================================================
   Display title — wraps the last word in <em> for terracotta accent
   ============================================================ */
export function DsDisplayTitle({
  text,
  eyebrow,
  subtitle,
}: {
  text: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  const head = lastSpace === -1 ? "" : trimmed.slice(0, lastSpace);
  const tail = lastSpace === -1 ? trimmed : trimmed.slice(lastSpace + 1);
  return (
    <div className="ds-title-main">
      {eyebrow ? <div className="ds-eyebrow">{eyebrow}</div> : null}
      <h1 className="ds-page-title">
        {head ? <>{head} </> : null}
        <em>{tail}</em>
      </h1>
      {subtitle ? <p className="ds-page-subtitle">{subtitle}</p> : null}
    </div>
  );
}

/* ============================================================
   Badge pill
   ============================================================ */
export type DsBadgeVariant =
  | "default"
  | "private"
  | "business"
  | "amber"
  | "verified"
  | "ghost"
  | "active"
  | "draft"
  | "inactive";

const BADGE_CLASS: Record<DsBadgeVariant, string> = {
  default: "",
  private: "ds-badge-private",
  business: "ds-badge-business",
  amber: "ds-badge-amber",
  verified: "ds-badge-verified",
  ghost: "ds-badge-ghost",
  active: "ds-badge-active",
  draft: "ds-badge-draft",
  inactive: "ds-badge-inactive",
};

export function DsBadge({
  variant = "default",
  children,
  withDot = false,
  className,
  ...rest
}: {
  variant?: DsBadgeVariant;
  children: ReactNode;
  withDot?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ds-badge-pill", BADGE_CLASS[variant], className)}
      {...rest}
    >
      {withDot ? <span className="dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/* ============================================================
   Empty state
   ============================================================ */
export function DsEmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="ds-empty-state">
      {icon ? <div className="ds-empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actions ? (
        <div
          style={{
            display: "inline-flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      ) : null}
    </section>
  );
}

/* ============================================================
   Button-like Link
   ============================================================ */
type DsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "default" | "primary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

export function DsLinkButton({
  href,
  variant = "default",
  size = "md",
  className,
  children,
  ...rest
}: DsLinkProps) {
  const cls = cn(
    "ds-btn",
    variant === "primary" && "ds-btn-primary",
    variant === "accent" && "ds-btn-accent",
    variant === "ghost" && "ds-btn-ghost",
    size === "sm" && "ds-btn-sm",
    size === "lg" && "ds-btn-lg",
    className,
  );
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
