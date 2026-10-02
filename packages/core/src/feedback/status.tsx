import * as React from "react";
import type { Tone } from "@tea-ui/tokens";
import { statusEntries, statusMeta, type StatusDomain, type StatusKey } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — the status surface.
 *
 * **The only supported way to render a status in TEA UI.** A component takes a
 * `domain` and a `key`, and this family derives the label, the tone and the
 * description from the shared registry in `@tea-ui/ux-standards`. Nothing here
 * accepts a colour or a hand-written word.
 *
 * That constraint is the fix. The audit found, across two products, five
 * hand-written status-to-label tables that did not agree — one said "Online"
 * where another said "Running" for the same wire value, and one used "Valid"
 * for a certificate where another used "Online". Keying on the wire value makes
 * that class of divergence a type error instead of a review comment.
 *
 * Colour is never the only signal. Every renderer pairs the tone with a word;
 * `StatusDot` additionally carries a title and visually hidden text.
 */

const TONE_DOT: Record<Tone, string> = {
  positive: "bg-positive",
  info: "bg-info",
  caution: "bg-caution",
  critical: "bg-critical",
  neutral: "bg-fg-muted",
};

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  info: "text-info",
  caution: "text-caution",
  critical: "text-critical",
  neutral: "text-fg-muted",
};

const TONE_CHIP: Record<Tone, string> = {
  positive: "bg-positive-subtle text-positive border-positive-border",
  info: "bg-info-subtle text-info border-info-border",
  caution: "bg-caution-subtle text-caution border-caution-border",
  critical: "bg-critical-subtle text-critical border-critical-border",
  neutral: "bg-neutral-subtle text-fg-muted border-neutral-border",
};

export type StatusDomainKey<D extends StatusDomain> = StatusKey<D>;

export interface StatusBaseProps<D extends StatusDomain> {
  /** Which status vocabulary the key belongs to. */
  domain: D;
  /** The wire value. Type-checked against the domain. */
  status: StatusKey<D>;
  className?: string | undefined;
}

export interface StatusDotProps<D extends StatusDomain> extends StatusBaseProps<D> {
  size?: "sm" | "md" | undefined;
  /**
   * Hide the visually hidden text. Only for a dot inside a row that already
   * states the same status as visible text — never as a shortcut.
   */
  hideLabel?: boolean | undefined;
}

/**
 * A dot plus a word. A fully rounded one here is one of the documented geometric
 * exceptions: a status indicator is a *mark*, not a surface, and the design
 * language's square rule applies to surfaces.
 *
 * The class name is deliberately not written out. Tailwind scans this file for
 * class names, comments included, so naming the rounded utility in prose emitted
 * the banned utility into every consumer's compiled stylesheet — the
 * documentation of the ban was the only reason the banned class existed.
 */
export function StatusDot<D extends StatusDomain>({
  domain,
  status,
  size = "md",
  hideLabel = false,
  className,
}: StatusDotProps<D>): React.ReactElement {
  const meta = statusMeta(domain, status);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={meta.description}
      {...dataSlot("status", "dot")}
      {...stateAttributes({ checked: true })}
    >
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 rounded-pill",
          size === "sm" ? "size-1.5" : "size-2",
          TONE_DOT[meta.tone],
        )}
      />
      {hideLabel ? null : <span className="sr-only">{meta.label}</span>}
    </span>
  );
}

export interface StatusBadgeProps<D extends StatusDomain> extends StatusBaseProps<D> {
  /** Show the registry description as a secondary line. */
  showDescription?: boolean | undefined;
  title?: string | undefined;
}

/** A bordered chip with a dot and the registry label. The default choice. */
export function StatusBadge<D extends StatusDomain>({
  domain,
  status,
  showDescription = false,
  title,
  className,
}: StatusBadgeProps<D>): React.ReactElement {
  const meta = statusMeta(domain, status);
  return (
    <span
      title={title ?? meta.description}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-micro font-medium leading-none",
        TONE_CHIP[meta.tone],
        className,
      )}
      {...dataSlot("status", "badge")}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-pill", TONE_DOT[meta.tone])} />
      {meta.label}
      {showDescription ? <span className="font-normal text-fg-muted">{meta.description}</span> : null}
    </span>
  );
}

export interface StatusTextProps<D extends StatusDomain> extends StatusBaseProps<D> {
  title?: string | undefined;
}

/** The label alone. For dense rows where a chip would be too heavy. */
export function StatusText<D extends StatusDomain>({
  domain,
  status,
  title,
  className,
}: StatusTextProps<D>): React.ReactElement {
  const meta = statusMeta(domain, status);
  return (
    <span title={title ?? meta.description} className={cn("text-ui", TONE_TEXT[meta.tone], className)} {...dataSlot("status", "text")}>
      {meta.label}
    </span>
  );
}

export interface StatusSelectProps<D extends StatusDomain> {
  domain: D;
  /** Controlled value. */
  value?: StatusKey<D> | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: StatusKey<D> | undefined;
  /** Called with the chosen wire value. Never a colour. */
  onValueChange?: ((value: StatusKey<D>) => void) | undefined;
  /** Accessible name for the group. */
  label: string;
  disabled?: boolean | undefined;
  className?: string | undefined;
  /** Restrict the choices. Defaults to every key in the domain. */
  statuses?: readonly StatusKey<D>[] | undefined;
}

/**
 * The interactive picker over one domain's keys. A radiogroup, because choosing
 * one status *is* choosing one value from a small set — a listbox here would
 * add a level of interaction for no gain.
 *
 * It emits a wire value. The caller then decides what to do with it, which is
 * what keeps this component free of application logic.
 */
export function StatusSelect<D extends StatusDomain>({
  domain,
  value,
  defaultValue,
  onValueChange,
  label,
  disabled = false,
  className,
  statuses,
}: StatusSelectProps<D>): React.ReactElement {
  const [internal, setInternal] = React.useState<StatusKey<D>>(
    (defaultValue ?? statuses?.[0] ?? (statusEntries(domain)[0]?.[0] as StatusKey<D>)) as StatusKey<D>,
  );
  const current = (value ?? internal) as StatusKey<D>;
  const options = (statuses ?? statusEntries(domain).map(([key]) => key)) as Array<StatusKey<D>>;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...dataSlot("status", "select")}
      {...stateAttributes({ disabled })}
    >
      {options.map((option) => {
        const meta = statusMeta(domain, option);
        const selected = option === current;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            title={meta.description}
            disabled={disabled}
            data-tea-touch
            className={cn(
              "inline-flex items-center gap-1.5 border px-2 py-1 text-micro font-medium leading-none",
              "transition-colors duration-fast ease-standard",
              "disabled:pointer-events-none disabled:opacity-50",
              selected
                ? TONE_CHIP[meta.tone]
                : "border-line bg-transparent text-fg-muted hover:border-line-strong hover:text-fg",
            )}
            onClick={() => {
              setInternal(option);
              onValueChange?.(option);
            }}
          >
            <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-pill", TONE_DOT[meta.tone])} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
