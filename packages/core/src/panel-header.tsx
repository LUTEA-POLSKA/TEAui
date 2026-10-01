import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "./internal";

/**
 * TEA UI — PanelHeader.
 *
 * §5.1 of the audit: **eight sites in one product, three in the other, one
 * pattern** — `grid size-7 place-items-center rounded-md bg-foreground/5` +
 * `text-sm font-medium leading-tight` + `text-[11px] leading-tight`. The audit's
 * own note on it is the part that matters: *"it uses `rounded-md` — a
 * radius-law violation that survived 8 times."*
 *
 * So this component exists partly to make that **impossible to reproduce**: the
 * tile is `rounded-none`, because an icon tile is a surface, and `pill` is
 * reserved for the five documented semantics. The 11px subtitle is the
 * `text-label` token rather than a `text-[11px]` class string, so it can never
 * be the 10px variant one careless edit away.
 *
 * ### One shape, two levels
 *
 * The audit found "the same shape at two element levels" — a section-level `h3`
 * in one product and a page-level `h1` in the other, duplicating each other.
 * `level` is therefore a required prop with no default, exactly like
 * `CardTitle`'s: a heading level guessed wrong is invisible until someone needs
 * the document outline, and a page whose only `h1` is a card title is a page a
 * screen reader cannot summarise.
 *
 * `Panel` in the same package solves the *frame* problem (a titled region with a
 * body). This solves the *header* problem, for the case where the header is not
 * the top of a `Panel` — a list section, a dialog body, a page head.
 */
export interface PanelHeaderProps extends React.ComponentProps<"header"> {
  /** The heading text. */
  title: string;
  /** The heading level. No default: a wrong guess breaks the document outline. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** One line under the title. */
  description?: React.ReactNode | undefined;
  /** Glyph in a tile at the start edge. Decorative — the title is the name. */
  icon?: React.ReactNode | undefined;
  /** Right-aligned content: a refresh control, a link, a menu. */
  actions?: React.ReactNode | undefined;
  /** The tile's size. `sm` for a section, `md` for a page. */
  iconSize?: "sm" | "md" | "lg" | undefined;
  className?: string | undefined;
}

const TILE_SIZE = {
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
} as const;

const TITLE_SIZE = {
  1: "text-section",
  2: "text-title",
  3: "text-lead",
  4: "text-ui",
  5: "text-ui",
  6: "text-label",
} as const;

/**
 * @example
 * ```tsx
 * <PanelHeader
 *   level={3}
 *   title="Resources"
 *   description="Current readings"
 *   icon={<Activity size={14} />}
 *   actions={<RefreshButton refreshing={busy} onClick={reload} />}
 * />
 * ```
 */
export const PanelHeader = React.forwardRef<HTMLElement, PanelHeaderProps>(function PanelHeader(
  { title, level, description, icon, actions, iconSize = "sm", className, ...props },
  ref,
) {
  const Heading = `h${level}` as "h2";

  return (
    <header
      ref={ref}
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3",
        className,
      )}
      {...dataSlot("panel-header")}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? (
          // `aria-hidden`: the title beside it is the accessible name, and an
          // announced glyph in front of it is noise. And `rounded-none`, because
          // this is a surface — the eight source sites that used `rounded-md`
          // here are the reason this component exists.
          <span
            aria-hidden="true"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-none bg-surface-3 text-fg-muted",
              TILE_SIZE[iconSize],
            )}
            {...dataSlot("panel-header", "icon")}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <Heading className={cn("font-semibold leading-tight text-fg", TITLE_SIZE[level])}>
            {title}
          </Heading>
          {/*
            `text-label` is the 11px token with the uppercase tracking already
            applied. `text-[11px]` was the source of the drift: it is one
            character away from being 10px, and the audit found 10px carrying
            real UI text in both products.
          */}
          {description ? (
            <p className="mt-0.5 text-label leading-tight text-fg-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2" {...dataSlot("panel-header", "actions")}>
          {actions}
        </div>
      ) : null}
    </header>
  );
});
