import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "./internal";

/**
 * TEA UI — Card.
 *
 * The single most duplicated element in the source projects: the audit counted
 * **twenty hand-typed copies of a bordered, padded surface** in one product,
 * varying between `p-3`, `p-4`, `p-5`, `p-6` and `p-8`, and with one file
 * defining its own local `Card({ title })` that shadowed the kit concept
 * entirely. This is the one implementation.
 *
 * Two decisions worth stating, because both are load-bearing:
 *
 *  - **`CardTitle` renders a heading element, not a `div`.** The source
 *    component rendered `<div>` for its title, which silently flattened the
 *    heading structure of every page that used it. A screen-reader user
 *    navigating by heading had nothing to navigate by. `level` is therefore a
 *    prop with no default guess: a card on a page whose top heading is an `h1`
 *    almost always wants `h2`, and guessing wrong is invisible until someone
 *    needs the outline.
 *  - **The surface never overrides its own padding silently.** `CardContent`
 *    takes the density's `pad-card` step, so "how padded is a card" has one
 *    answer rather than twenty.
 */
export interface CardProps extends React.ComponentProps<"div"> {
  /** Set `false` to drop the border — for a card nested inside another card. */
  bordered?: boolean | undefined;
  className?: string | undefined;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { bordered = true, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface",
        bordered ? "border border-line" : "border border-transparent",
        className,
      )}
      {...dataSlot("card")}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 border-b border-line pad-card pb-3", className)}
        {...dataSlot("card", "header")}
        {...props}
      />
    );
  },
);

export const CardBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn("pad-card", className)} {...dataSlot("card", "body")} {...props} />;
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap items-center gap-2 border-t border-line pad-card pt-3", className)}
        {...dataSlot("card", "footer")}
        {...props}
      />
    );
  },
);

export interface CardTitleProps extends React.ComponentProps<"div"> {
  /** The heading level. No default: a wrong guess breaks the document outline. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string | undefined;
}

const CARD_TITLE_SIZE: Record<CardTitleProps["level"], string> = {
  1: "text-section",
  2: "text-title",
  3: "text-lead",
  4: "text-ui",
  5: "text-ui",
  6: "text-label",
};

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { level, className, ...props },
  ref,
) {
  const Tag = `h${level}` as "h2";
  return (
    <Tag
      ref={ref}
      className={cn("font-semibold text-fg", CARD_TITLE_SIZE[level], className)}
      {...dataSlot("card", "title")}
      {...props}
    />
  );
});

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn("text-micro text-fg-muted", className)}
        {...dataSlot("card", "description")}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Panel: a titled region inside a page                                         */
/* -------------------------------------------------------------------------- */

/**
 * The audit's second-most-duplicated element: an icon + title + subtitle header
 * appeared at eight call sites with the same class string. `Panel` is that
 * header with a body, and it is what `Card` + `CardHeader` compose into when
 * the region is a section rather than a discrete item.
 */
export interface PanelProps extends React.ComponentProps<"section"> {
  title: string;
  description?: string | undefined;
  /** Icon before the title. Decorative. */
  icon?: React.ReactNode | undefined;
  /** Right-aligned header content, e.g. a refresh control. */
  actions?: React.ReactNode | undefined;
  /** The heading level of `title`. */
  level?: 2 | 3 | 4 | undefined;
  className?: string | undefined;
}

export const Panel = React.forwardRef<HTMLElement, PanelProps>(function Panel(
  { title, description, icon, actions, level = 2, className, children, ...props },
  ref,
) {
  const Heading = `h${level}` as "h2";
  return (
    <section ref={ref} className={cn("border border-line bg-surface", className)} {...dataSlot("panel")} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pad-card">
        <div className="flex min-w-0 items-start gap-2">
          {icon ? (
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center bg-surface-3 text-fg-muted"
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <Heading className="text-ui font-semibold leading-tight text-fg">{title}</Heading>
            {description ? (
              <p className="mt-0.5 text-label leading-tight text-fg-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className="pad-card">{children}</div>
    </section>
  );
});
