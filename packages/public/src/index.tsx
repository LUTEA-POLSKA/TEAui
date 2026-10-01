import * as React from "react";
import { Slot } from "radix-ui";
import { Menu, X } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";
import {
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  Heading,
  HStack,
  IconButton,
  InlineCode,
  Link,
  SkipLink,
  Stack,
  Text,
} from "@tea-ui/core";

/**
 * TEA UI Public — website chrome and marketing sections.
 *
 * Public UI is **not** Admin UI with different colours, and this file is where
 * that has to be true. The differences are structural, and each one is a
 * consequence of the audience:
 *
 *  - **Measure.** Admin text runs to the edge because a table needs the width.
 *    Prose does not: it runs to `max-w-3xl`, because a 120-character line is
 *    unreadable. Every section here is width-constrained for that reason.
 *  - **Type size.** Admin lives at `text-ui` (14px). Public body text is
 *    `text-body` (16px) minimum, and lead text is larger still. The audit found
 *    real text at 9px and 10px in the *admin* surfaces; a marketing page would
 *    be worse.
 *  - **Rhythm.** Sections are separated by far more space than panels are,
 *    because a page is a scroll narrative and a panel is a work surface.
 *  - **Conversion.** The primary action repeats per section. On an admin page a
 *    repeated primary button is noise; on a public page it is the point.
 */
export type PublicSize = "sm" | "md" | "lg";

/* ========================================================================== */
/* Section                                                                     */
/* ========================================================================== */

export interface SectionProps extends React.ComponentProps<"section"> {
  /** Vertical rhythm. `tight` sits between related blocks, `loose` between them. */
  spacing?: "tight" | "normal" | "loose" | undefined;
  /** A hairline separator above the section. */
  bordered?: boolean | undefined;
  children: React.ReactNode;
}

/**
 * The unit of a marketing page. Everything in the Public layer is a `Section`,
 * so page rhythm is decided once and a page cannot accidentally use six
 * different vertical gaps.
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  { spacing = "normal", bordered = false, className, children, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        spacing === "tight" && "py-8",
        spacing === "normal" && "py-14",
        spacing === "loose" && "py-20",
        bordered && "border-t border-line",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
});

/* ========================================================================== */
/* Hero                                                                        */
/* ========================================================================== */

export interface HeroProps extends React.ComponentProps<"section"> {
  /** The eyebrow above the headline. Sets the category, not the value. */
  eyebrow?: string | undefined;
  /** The headline. One sentence, the thing a visitor must understand. */
  title: string;
  /** The promise. One or two sentences, plain, no jargon. */
  lead?: string | undefined;
  /** Primary and secondary actions. */
  actions?: React.ReactNode | undefined;
  /** Trust markers under the actions: "Since 2019", "Made in Germany", logos. */
  reassurance?: React.ReactNode | undefined;
  /**
   * A visual below the copy — a screenshot, a diagram, a live demo. Optional,
   * because a hero that is only words is a legitimate hero, and forcing an empty
   * wrapper element to satisfy the type would be worse than the optional.
   */
  children?: React.ReactNode | undefined;
}

export const Hero = React.forwardRef<HTMLElement, HeroProps>(function Hero(
  { eyebrow, title, lead, actions, reassurance, className, children, ...props },
  ref,
) {
  return (
    <section ref={ref} className={cn("border-b border-line py-20", className)} {...props}>
      <Container size="lg">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-label font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          ) : null}
          <Heading level={1} className="mt-3 text-hero">
            {title}
          </Heading>
          {lead ? (
            <Text size="lead" tone="muted" className="mt-5 max-w-2xl">
              {lead}
            </Text>
          ) : null}
          {actions ? <HStack gap="ui" className="mt-8">{actions}</HStack> : null}
          {reassurance ? (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-micro text-fg-subtle">
              {reassurance}
            </div>
          ) : null}
        </div>
        {children ? <div className="mt-12">{children}</div> : null}
      </Container>
    </section>
  );
});

/* ========================================================================== */
/* Content blocks                                                              */
/* ========================================================================== */

export interface SectionHeadingProps {
  eyebrow?: string | undefined;
  title: string;
  lead?: string | undefined;
  /** `center` for a self-contained block, `start` when text follows it. */
  align?: "start" | "center" | undefined;
  level?: 2 | 3 | undefined;
  className?: string | undefined;
}

/**
 * The heading of a content block. `align="center"` is a real decision, not a
 * default: centred text with a centred image reads as a unit, and a centred
 * section followed by left-aligned content reads as a mistake.
 */
export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  function SectionHeading({ eyebrow, title, lead, align = "start", level = 2, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3",
          align === "center" && "items-center text-center",
          className,
        )}
      >
        {eyebrow ? (
          <p className="text-label font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        ) : null}
        <Heading level={level} className={level === 2 ? "max-w-2xl" : undefined}>
          {title}
        </Heading>
        {lead ? (
          <Text size="lead" tone="muted" className={cn("max-w-2xl", align === "center" && "mx-auto")}>
            {lead}
          </Text>
        ) : null}
      </div>
    );
  },
);

export interface FeatureGridProps extends React.ComponentProps<"div"> {
  cols?: 2 | 3 | 4 | undefined;
  /** Minimum column width; the grid auto-fits below the breakpoint. */
  minItemWidth?: string | undefined;
  children: React.ReactNode;
}

/**
 * The auto-fit grid is the reason a TEA marketing page has no per-breakpoint
 * column counts. The audit found the same class string
 * (`mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3`) copy-pasted at six sites,
 * drifting to `md:grid-cols-3` and `md:grid-cols-4` as the density changed.
 */
export const FeatureGrid = React.forwardRef<HTMLDivElement, FeatureGridProps>(function FeatureGrid(
  { cols = 3, minItemWidth = "16rem", className, children, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`,
        ...style,
      }}
      className={cn("grid gap-6", className)}
      data-cols={cols}
      {...props}
    >
      {children}
    </div>
  );
});

export interface FeatureProps extends React.ComponentProps<"article"> {
  title: string;
  description: string;
  icon?: React.ReactNode | undefined;
  /** A short proof line: a number, a benchmark, a customer. */
  proof?: string | undefined;
}

/**
 * A feature. It is an `<article>`, not a `div`, because a feature is a
 * self-contained claim and an article is what that is in the document outline.
 */
export const Feature = React.forwardRef<HTMLElement, FeatureProps>(function Feature(
  { title, description, icon, proof, className, ...props },
  ref,
) {
  return (
    <article ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center bg-accent text-accent-fg"
        >
          {icon}
        </span>
      ) : null}
      <Heading level={3}>{title}</Heading>
      <Text size="body" tone="muted">
        {description}
      </Text>
      {proof ? (
        <Text size="micro" tone="subtle" className="font-mono">
          {proof}
        </Text>
      ) : null}
    </article>
  );
});

export interface CallToActionProps extends React.ComponentProps<"section"> {
  title: string;
  lead?: string | undefined;
  actions: React.ReactNode;
  /** `banner` closes the page; `inline` sits inside a section. */
  variant?: "banner" | "inline" | undefined;
}

export const CallToAction = React.forwardRef<HTMLElement, CallToActionProps>(function CallToAction(
  { title, lead, actions, variant = "banner", className, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        variant === "banner" ? "border-t border-line py-20" : "py-10",
        className,
      )}
      {...props}
    >
      <Container size="lg">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <Heading level={2}>{title}</Heading>
            {lead ? (
              <Text size="lead" tone="muted" className="mt-3">
                {lead}
              </Text>
            ) : null}
          </div>
          <HStack gap="ui" className="shrink-0">
            {actions}
          </HStack>
        </div>
      </Container>
    </section>
  );
});

/* ========================================================================== */
/* Content                                                                     */
/* ========================================================================== */

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

/**
 * A FAQ.
 *
 * A `<details>`/`<summary>` pair, not a component with JavaScript: the browser
 * already implements expand, collapse, keyboard operation and the correct
 * semantics, and every hand-rolled accordion FAQ in the audit shipped without
 * `aria-expanded`.
 */
export const Faq = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { items: readonly FaqItem[] }>(
  function Faq({ items, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn("mx-auto flex max-w-3xl flex-col", className)} {...props}>
        {items.map((item) => (
          <details key={item.question} className="group border-b border-line py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-ui font-medium text-fg marker:content-none">
              {item.question}
              <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-3 text-body text-fg-muted">{item.answer}</div>
          </details>
        ))}
      </div>
    );
  },
);

export interface PricingTier {
  name: string;
  price: string;
  /** The billing period, e.g. "per month". */
  period?: string | undefined;
  description?: string | undefined;
  features: readonly string[];
  highlighted?: boolean | undefined;
  action?: React.ReactNode | undefined;
}

/**
 * Pricing.
 *
 * The price is the largest type on the card, because that is what the visitor
 * came for. A card that lists eleven features in eleven equal rows gives the
 * price the same weight as the last row item, which buries the decision.
 */
export const PricingTable = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { tiers: readonly PricingTier[] }
>(function PricingTable({ tiers, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("grid gap-6 md:grid-cols-3", className)} {...props}>
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={cn(
            "flex flex-col gap-5 border bg-surface p-6",
            tier.highlighted ? "border-primary" : "border-line",
          )}
        >
          <div>
            <Text size="label" tone={tier.highlighted ? "accent" : "muted"} className="font-semibold uppercase tracking-widest">
              {tier.name}
            </Text>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-display font-semibold text-fg">{tier.price}</span>
              {tier.period ? <Text size="micro" tone="muted">{tier.period}</Text> : null}
            </div>
            {tier.description ? (
              <Text size="micro" tone="muted" className="mt-2">
                {tier.description}
              </Text>
            ) : null}
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-ui text-fg-muted">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-pill bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
          {tier.action}
        </div>
      ))}
    </div>
  );
});

/* ========================================================================== */
/* Navigation                                                                  */
/* ========================================================================== */

export interface PublicNavLink {
  label: string;
  href: string;
  /** Opens in a new tab. Adds `rel` and an accessible hint. */
  external?: boolean | undefined;
}

export interface PublicNavbarProps extends React.ComponentProps<"header"> {
  brand: React.ReactNode;
  links: readonly PublicNavLink[];
  /** Always-visible action, e.g. "Sign in". */
  action?: React.ReactNode | undefined;
  /** Id of the main region, for the skip link. */
  mainId?: string | undefined;
  className?: string | undefined;
}

/**
 * A public navbar.
 *
 * The audit found the decisive defect in a real public header: the desktop nav
 * was `hidden md:flex` and **there was no mobile menu at all**, so the entire
 * navigation simply disappeared below 768px. Below `md` this becomes a drawer
 * with the same links, because a hidden navigation is not a responsive
 * navigation.
 */
export const PublicNavbar = React.forwardRef<HTMLElement, PublicNavbarProps>(function PublicNavbar(
  { brand, links, action, mainId = "tea-public-main", className, children, ...props },
  ref,
) {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      ref={ref}
      className={cn("sticky top-0 z-header border-b border-line bg-canvas", className)}
      {...props}
    >
      <SkipLink targetId={mainId} />
      <Container size="full" className="flex h-16 items-center gap-6">
        <Link href="#" className="text-ui font-semibold tracking-tight text-fg no-underline hover:no-underline">
          {brand}
        </Link>
        <nav aria-label={COPY.navigation.main} className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              external={link.external}
              className="text-ui text-fg-muted no-underline hover:text-fg hover:no-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <HStack gap="ui" className="ms-auto">
          {action}
          <IconButton
            label={COPY.navigation.openMenu}
            variant="ghost"
            className="md:hidden"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </IconButton>
        </HStack>
      </Container>
      {children}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side="end" className="w-80">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between text-ui">
              {COPY.navigation.main}
              <IconButton label={COPY.navigation.closeMenu} variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X size={18} aria-hidden="true" />
              </IconButton>
            </DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <nav aria-label={COPY.navigation.main}>
              <Stack gap="ui">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    external={link.external}
                    className="text-ui text-fg no-underline hover:text-primary hover:no-underline"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </header>
  );
});

export interface PublicFooterProps extends React.ComponentProps<"footer"> {
  brand: React.ReactNode;
  /** Label-to-link column groups. */
  columns: ReadonlyArray<{ heading: string; links: readonly PublicNavLink[] }>;
  /** Legal line: imprint, privacy, copyright. Never optional on a public site. */
  legal: React.ReactNode;
  className?: string | undefined;
}

export const PublicFooter = React.forwardRef<HTMLElement, PublicFooterProps>(function PublicFooter(
  { brand, columns, legal, className, ...props },
  ref,
) {
  return (
    <footer ref={ref} className={cn("border-t border-line py-12", className)} {...props}>
      <Container size="full">
        <div className="grid gap-10 md:grid-cols-[2fr_repeat(auto-fit,minmax(9rem,1fr))]">
          <div>
            <div className="text-ui font-semibold text-fg">{brand}</div>
            <Text size="micro" tone="muted" className="mt-2 max-w-xs">
              Build once. Generalize properly. Reuse everywhere.
            </Text>
          </div>
          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-label font-semibold uppercase tracking-widest text-fg-subtle">
                {column.heading}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      external={link.external}
                      className="text-ui text-fg-muted no-underline hover:text-fg hover:no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Divider className="my-8" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-micro text-fg-subtle">{legal}</div>
      </Container>
    </footer>
  );
});

/* ========================================================================== */
/* Conversion                                                                  */
/* ========================================================================== */

export interface ConversionFormProps extends React.ComponentProps<"form"> {
  title: string;
  description?: string | undefined;
  /** Submit handler. The form shows no success state on its own. */
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Rendered while submitting. Disable the submit control as well. */
  busy?: boolean | undefined;
  submitLabel?: string | undefined;
  children: React.ReactNode;
}

/**
 * A conversion form.
 *
 * The audit found a public contact form whose `<label>` elements were never
 * associated with their controls, and a login form with a working `htmlFor` that
 * was the exception. `Field` makes the correct version the shortest one.
 */
export const ConversionForm = React.forwardRef<HTMLFormElement, ConversionFormProps>(
  function ConversionForm(
    { title, description, onSubmit, busy = false, submitLabel, className, children, ...props },
    ref,
  ) {
    return (
      <form
        ref={ref}
        onSubmit={onSubmit}
        className={cn("flex flex-col gap-4", className)}
        aria-busy={busy || undefined}
        {...props}
      >
        <Heading level={2}>{title}</Heading>
        {description ? (
          <Text size="ui" tone="muted">
            {description}
          </Text>
        ) : null}
        {children}
        <div>
          <Button type="submit" loading={busy}>
            {busy ? COPY.states.saving : (submitLabel ?? COPY.actions.save)}
          </Button>
        </div>
      </form>
    );
  },
);

/* ========================================================================== */

export { Box, Container, Slot, InlineCode };
