import * as React from "react";
import { X } from "@tea-ui/icons";
import type { Tone } from "@tea-ui/tokens";
import { COPY } from "@tea-ui/ux-standards";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — Alert and Callout.
 *
 * These are **siblings, not aliases**, and the distinction is the whole point:
 *
 *  - **`Alert` interrupts.** It owns an ARIA live region, so a screen reader
 *    announces it as it appears. Use it when the user must know *now* — an
 *    operation failed, a service is down, a destructive action is confirmed.
 *  - **`Callout` does not interrupt.** It is static page content: a note in a
 *    panel, a hint under a field, an aside in an article. It is present when the
 *    user arrives and is never announced after the fact.
 *
 * The audit found nine copy-pasted error banners in one product and none in a
 * component; the class string was identical in all nine, `role="alert"` was
 * present in only two, the text colour drifted between two reds, and the
 * padding drifted between three values. `Alert` makes that divergence
 * impossible.
 */

export const alertVariants = cva(
  [
    "flex items-start gap-3 border p-3 text-ui",
    "[&>svg]:mt-0.5 [&>svg]:shrink-0",
  ],
  {
    variants: {
      tone: {
        positive: "border-positive-border bg-positive-subtle text-positive",
        info: "border-info-border bg-info-subtle text-info",
        caution: "border-caution-border bg-caution-subtle text-caution",
        critical: "border-critical-border bg-critical-subtle text-critical",
        neutral: "border-line bg-surface-2 text-fg-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** A tone interrupts when it means "the thing you asked for did not happen". */
const INTERRUPTS: Record<Tone, boolean> = {
  positive: false,
  info: false,
  caution: true,
  critical: true,
  neutral: false,
};

export interface AlertProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof alertVariants> {
  /** Icon shown before the content. Keep it decorative. */
  icon?: React.ReactNode | undefined;
  /** Render a dismiss button. The label comes from `COPY.a11y.close`. */
  onDismiss?: (() => void) | undefined;
  /**
   * Override the live-region role. Defaults to `alert` for interrupting tones
   * and `status` for the rest, which is the correct pairing in both directions.
   */
  role?: "alert" | "status" | undefined;
  className?: string | undefined;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, tone = "neutral", icon, onDismiss, role, children, ...props },
  ref,
) {
  const resolvedTone = tone ?? "neutral";
  const resolvedRole = role ?? (INTERRUPTS[resolvedTone] ? "alert" : "status");
  return (
    <div
      ref={ref}
      role={resolvedRole}
      className={cn(alertVariants({ tone: resolvedTone }), className)}
      {...dataSlot("alert")}
      {...stateAttributes({ invalid: resolvedTone === "critical" })}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div className="min-w-0 flex-1 text-fg">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={COPY.a11y.close}
          className="shrink-0 text-fg-muted transition-colors hover:text-fg"
          {...dataSlot("alert", "dismiss")}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function AlertTitle({ className, ...props }, ref) {
    return <p ref={ref} className={cn("font-semibold text-fg", className)} {...dataSlot("alert", "title")} {...props} />;
  },
);

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function AlertDescription({ className, ...props }, ref) {
    return <p ref={ref} className={cn("text-micro text-fg-muted", className)} {...dataSlot("alert", "description")} {...props} />;
  },
);

/** Where the primary recovery action goes. Cancel must stay the easy path. */
export const AlertAction = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function AlertAction({ className, ...props }, ref) {
    return <div ref={ref} className={cn("mt-2 flex flex-wrap items-center gap-2", className)} {...dataSlot("alert", "action")} {...props} />;
  },
);

/* -------------------------------------------------------------------------- */

export const calloutVariants = cva("border-l-2 py-1 ps-3 text-ui", {
  variants: {
    tone: {
      positive: "border-positive text-fg-muted",
      info: "border-info text-fg-muted",
      caution: "border-caution text-fg-muted",
      critical: "border-critical text-fg-muted",
      neutral: "border-line-strong text-fg-muted",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface CalloutProps extends React.ComponentProps<"aside">, VariantProps<typeof calloutVariants> {
  /** The heading. Omit for a plain note. */
  title?: string | undefined;
  className?: string | undefined;
}

/**
 * A static, non-interrupting note. Never has a live region, because it was
 * present before the user read it and nothing about it changes afterwards.
 */
export const Callout = React.forwardRef<HTMLElement, CalloutProps>(function Callout(
  { className, tone = "neutral", title, children, ...props },
  ref,
) {
  return (
    <aside ref={ref} className={cn(calloutVariants({ tone }), className)} {...dataSlot("callout")} {...props}>
      {title ? <p className="mb-1 text-micro font-semibold uppercase tracking-widest text-fg">{title}</p> : null}
      {children}
    </aside>
  );
});
