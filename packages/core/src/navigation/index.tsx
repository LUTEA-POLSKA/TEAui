import * as React from "react";
import { Slot } from "radix-ui";
import {
  Accordion as AccordionPrimitive,
  Collapsible as CollapsiblePrimitive,
  NavigationMenu as NavigationMenuPrimitive,
  Tabs as TabsPrimitive,
  Toolbar as ToolbarPrimitive,
} from "radix-ui";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "@tea-ui/icons";
import { cn, cva } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot, useControllableState } from "../internal";
import { Button } from "../inputs/button";

/* ========================================================================== */
/* Tabs                                                                        */
/* ========================================================================== */

/**
 * Tabs are for **peer views of the same subject**. If the things being switched
 * between are not peers, they are navigation, and they belong in a sidebar —
 * promoting peers into the top level is how information architecture collapses.
 *
 * The active indicator is a weight change as well as a colour change. A tab
 * that is only distinguished by hue is unreadable to a user with a colour
 * vision deficiency and invisible in a screenshot printed in greyscale.
 */
export interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "children"> {
  children: React.ReactNode;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs({ children, ...props }, ref) {
  return <TabsPrimitive.Root ref={ref} {...props} {...dataSlot("tabs")}>{children}</TabsPrimitive.Root>;
});

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-0 border-b border-line",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e",
        className,
      )}
      {...dataSlot("tabs", "list")}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative control-h border-0 bg-transparent px-3 text-ui text-fg-muted",
        "border-b-2 border-transparent transition-colors duration-fast ease-standard",
        "hover:text-fg",
        "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium",
        "data-[orientation=vertical]:w-full data-[orientation=vertical]:border-e-0 data-[orientation=vertical]:border-s-2 data-[orientation=vertical]:text-start",
        className,
      )}
      data-tea-touch
      {...dataSlot("tabs", "trigger")}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("focus-visible:outline-none", className)}
      tabIndex={0}
      {...dataSlot("tabs", "content")}
      {...props}
    />
  );
});

/* ========================================================================== */
/* Collapsible                                                                  */
/* ========================================================================== */

export interface CollapsibleProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>, "defaultValue"> {
  defaultOpen?: boolean | undefined;
}

/** Progressive disclosure. The trigger owns `aria-expanded` and `aria-controls`. */
export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { defaultOpen = false, ...props },
  ref,
) {
  return <CollapsiblePrimitive.Root ref={ref} defaultOpen={defaultOpen} {...dataSlot("collapsible")} {...props} />;
});

export const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(function CollapsibleTrigger({ className, children, ...props }, ref) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      className={cn(
        "group flex w-full items-center justify-between gap-2 text-start text-ui font-medium text-fg",
        className,
      )}
      data-tea-touch
      {...dataSlot("collapsible", "trigger")}
      {...props}
    >
      {children}
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="shrink-0 text-fg-muted transition-transform duration-fast group-data-[state=open]:rotate-180"
      />
    </CollapsiblePrimitive.CollapsibleTrigger>
  );
});

export const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(function CollapsibleContent({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={ref}
      className={cn(
        "overflow-hidden",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top",
        className,
      )}
      {...dataSlot("collapsible", "content")}
      {...props}
    />
  );
});

/* ========================================================================== */
/* Accordion                                                                    */
/* ========================================================================== */

export interface AccordionProps
  extends Omit<React.ComponentProps<"div">, "children" | "color" | "dir"> {
  type?: "single" | "multiple" | undefined;
  /** Single type only: allow closing the open item. */
  collapsible?: boolean | undefined;
  defaultValue?: string | string[] | undefined;
  value?: string | string[] | undefined;
  onValueChange?: ((value: never) => void) | undefined;
  children: React.ReactNode;
}

/**
 * Radix types the accordion root as a `single | multiple` union, so a forwardable
 * `type` and `value` pair is genuinely correct and only the narrowing is
 * unrepresentable. Dispatched once, here.
 */
const AccordionRootPrimitive = AccordionPrimitive.Root as unknown as React.ComponentType<
  React.ComponentProps<"div"> & Record<string, unknown>
>;

/**
 * An accordion is a list of questions with answers that belong together. If the
 * sections are unrelated, they are `<Collapsible>`s, not one accordion — a
 * single-value accordion forces the user to close one answer to read the next,
 * which only makes sense when the answers are alternatives.
 */
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { type = "single", collapsible = true, defaultValue, value, onValueChange, className, children, ...props },
  ref,
) {
  return (
    <AccordionRootPrimitive
      ref={ref}
      type={type}
      collapsible={type === "single" ? collapsible : undefined}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("border-t border-line", className)}
      {...dataSlot("accordion")}
      {...props}
    >
      {children}
    </AccordionRootPrimitive>
  );
});

export const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item ref={ref} className={cn("border-b border-line", className)} {...dataSlot("accordion", "item")} {...props} />
  );
});

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 items-center justify-between gap-3 py-3 text-start text-ui font-medium text-fg",
          className,
        )}
        data-tea-touch
        {...dataSlot("accordion", "trigger")}
        {...props}
      >
        {children}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="shrink-0 text-fg-muted transition-transform duration-fast group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-ui text-fg-muted",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top",
        className,
      )}
      {...dataSlot("accordion", "content")}
      {...props}
    >
      <div className="pb-3 pe-8">{children}</div>
    </AccordionPrimitive.Content>
  );
});

/* ========================================================================== */
/* Breadcrumb                                                                   */
/* ========================================================================== */

/**
 * A breadcrumb shows *where you are*; a back button shows *where you were*.
 * Below three levels of hierarchy you need both, and neither alone.
 */
export const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentProps<"nav">>(function Breadcrumb(
  { className, children, ...props },
  ref,
) {
  return (
    <nav ref={ref} aria-label={COPY.navigation.breadcrumb} className={cn(className)} {...dataSlot("breadcrumb")} {...props}>
      <ol className="flex flex-wrap items-center gap-1 text-micro text-fg-muted">{children}</ol>
    </nav>
  );
});

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn("flex items-center gap-1", className)} {...dataSlot("breadcrumb", "item")} {...props} />;
  },
);

export interface BreadcrumbLinkProps extends React.ComponentProps<"a"> {
  asChild?: boolean | undefined;
}

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  function BreadcrumbLink({ className, asChild = false, children, ...props }, ref) {
    const Component = asChild ? Slot.Root : "a";
    return (
      <Component
        ref={ref}
        className={cn("transition-colors hover:text-fg", className)}
        {...dataSlot("breadcrumb", "link")}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

/** The current page. `aria-current` is what makes it announceable, not the style. */
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={cn("font-medium text-fg", className)}
        {...dataSlot("breadcrumb", "page")}
        {...props}
      />
    );
  },
);

/** Decorative by definition — the `<ol>` already conveys the hierarchy. */
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  function BreadcrumbSeparator({ className, children, ...props }, ref) {
    return (
      <li ref={ref} aria-hidden="true" className={cn("text-fg-subtle", className)} {...dataSlot("breadcrumb", "separator")} {...props}>
        {children ?? "/"}
      </li>
    );
  },
);

/* ========================================================================== */
/* Pagination                                                                   */
/* ========================================================================== */

export const paginationLinkVariants = cva(
  "inline-flex min-w-8 items-center justify-center gap-1 border border-line px-2 text-ui text-fg-muted transition-colors hover:border-line-strong hover:text-fg aria-[current=page]:border-primary aria-[current=page]:text-primary",
);

export interface PaginationProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  /** Current page, 1-based. */
  page: number;
  /** How many pages exist in total. */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Optional element describing what is being paginated. */
  itemLabel?: string | undefined;
  className?: string | undefined;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  itemLabel,
  className,
  ...props
}: PaginationProps): React.ReactElement {
  const go = (next: number) => onPageChange(Math.min(pageCount, Math.max(1, next)));
  return (
    <nav
      aria-label={COPY.a11y.page}
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      {...dataSlot("pagination")}
      {...props}
    >
      <PaginationSummary page={page} pageCount={pageCount} itemLabel={itemLabel} />
      <ul className="flex items-center gap-1">
        <li>
          <PaginationPrevious page={page} onPageChange={go} />
        </li>
        {pageWindow(page, pageCount).map((entry, index) =>
          entry === "ellipsis" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-fg-subtle">
              …
            </li>
          ) : (
            <li key={entry}>
              <PaginationLink page={entry} onPageChange={go} />
            </li>
          ),
        )}
        <li>
          <PaginationNext page={page} pageCount={pageCount} onPageChange={go} />
        </li>
      </ul>
    </nav>
  );
}

function PaginationSummary({
  page,
  pageCount,
  itemLabel,
}: {
  page: number;
  pageCount: number;
  itemLabel?: string | undefined;
}): React.ReactElement {
  return (
    <p className="text-micro text-fg-muted">
      {COPY.a11y.page} {page} {COPY.a11y.of} {pageCount}
      {itemLabel ? ` · ${itemLabel}` : null}
    </p>
  );
}

function PaginationLink({ page, onPageChange }: { page: number; onPageChange: (page: number) => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onPageChange(page)}
      aria-current="page"
      aria-label={`${COPY.a11y.page} ${page}`}
      className={paginationLinkVariants()}
      data-tea-touch
    >
      {page}
    </button>
  );
}

function PaginationPrevious({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (page: number) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onPageChange(page - 1)}
      disabled={page <= 1}
      aria-label={COPY.actions.back}
      className={cn(paginationLinkVariants(), "disabled:pointer-events-none disabled:opacity-50")}
      data-tea-touch
    >
      <ChevronsLeft size={14} aria-hidden="true" />
    </button>
  );
}

function PaginationNext({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onPageChange(page + 1)}
      disabled={page >= pageCount}
      aria-label={COPY.actions.next}
      className={cn(paginationLinkVariants(), "disabled:pointer-events-none disabled:opacity-50")}
      data-tea-touch
    >
      <ChevronsRight size={14} aria-hidden="true" />
    </button>
  );
}

/** A short window around the current page; never more than nine entries. */
function pageWindow(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const entries: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) entries.push("ellipsis");
  for (let index = start; index <= end; index += 1) entries.push(index);
  if (end < pageCount - 1) entries.push("ellipsis");
  entries.push(pageCount);
  return entries;
}

/* ========================================================================== */
/* Skip link                                                                    */
/* ========================================================================== */

/**
 * The first focusable element on every page. Neither source product had one.
 *
 * It is visually hidden until focused, and it is genuinely useful rather than
 * ceremonial: a keyboard user arriving on a page with a 20-item sidebar would
 * otherwise have to tab through all of it on every single page.
 */
export interface SkipLinkProps extends React.ComponentProps<"a"> {
  /** The id of the main region to jump to. */
  targetId: string;
}

export function SkipLink({ targetId, className, children, ...props }: SkipLinkProps): React.ReactElement {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only z-max focus-visible:not-sr-only",
        "focus-visible:fixed focus-visible:start-3 focus-visible:top-3 focus-visible:border focus-visible:border-primary focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-ui focus-visible:font-medium focus-visible:text-primary-fg",
        className,
      )}
      {...dataSlot("skip-link")}
      {...props}
    >
      {children ?? COPY.navigation.skipToContent}
    </a>
  );
}

/* ========================================================================== */
/* Stepper                                                                      */
/* ========================================================================== */

export interface StepperProps extends Omit<React.ComponentProps<"ol">, "children"> {
  /** Zero-based index of the current step. */
  current: number;
  children: React.ReactNode;
}

export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { current, children, className, ...props },
  ref,
) {
  return (
    <ol
      ref={ref}
      className={cn("flex w-full items-center gap-2", className)}
      data-current-step={current}
      {...dataSlot("stepper")}
      {...props}
    >
      {children}
    </ol>
  );
});

export interface StepProps extends React.ComponentProps<"li"> {
  /** Index of this step. */
  index: number;
  /** Index of the current step. */
  current: number;
  /** Show a state label such as "Completed". */
  stateLabel?: string | undefined;
}

export function Step({ index, current, stateLabel, className, children, ...props }: StepProps): React.ReactElement {
  const state = index < current ? "complete" : index === current ? "current" : "upcoming";
  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      data-state={state}
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      {...dataSlot("stepper", "step")}
      {...props}
    >
      {children}
      {stateLabel ? <span className="sr-only">{stateLabel}</span> : null}
    </li>
  );
}

export function StepIndicator({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center border border-line text-micro font-semibold text-fg-muted",
        "group-data-[state=complete]:border-positive group-data-[state=complete]:bg-positive-subtle group-data-[state=complete]:text-positive",
        "group-data-[state=current]:border-primary group-data-[state=current]:text-primary",
        className,
      )}
      {...dataSlot("stepper", "indicator")}
      {...props}
    />
  );
}

export function StepSeparator({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return <span aria-hidden="true" className={cn("h-px flex-1 bg-line", className)} {...dataSlot("stepper", "separator")} {...props} />;
}

/* ========================================================================== */
/* Toolbar                                                                      */
/* ========================================================================== */

export const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root>
>(function Toolbar({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Root
      ref={ref}
      className={cn("flex items-center gap-2 border-b border-line px-3 py-2", className)}
      data-tea-touch
      {...dataSlot("toolbar")}
      {...props}
    />
  );
});

export const ToolbarButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  function ToolbarButton({ className, type = "button", ...props }, ref) {
    return <Button ref={ref} type={type} variant="ghost" size="sm" className={className} {...props} />;
  },
);

/* ========================================================================== */
/* NavigationMenu (mega menu)                                                   */
/* ========================================================================== */

export const NavigationMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(function NavigationMenu({ className, children, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn("relative flex items-center", className)}
      {...dataSlot("navigation-menu")}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
});

export const NavigationMenuList = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(function NavigationMenuList({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...dataSlot("navigation-menu", "list")}
      {...props}
    />
  );
});

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(function NavigationMenuTrigger({ className, children, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn("group control-h px-3 text-ui text-fg-muted hover:text-fg", className)}
      data-tea-touch
      {...dataSlot("navigation-menu", "trigger")}
      {...props}
    >
      {children}
      <ChevronDown size={14} aria-hidden="true" className="ms-1 transition-transform group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  );
});

export const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(function NavigationMenuContent({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn("p-2", className)}
      {...dataSlot("navigation-menu", "content")}
      {...props}
    />
  );
});

export const NavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> & { asChild?: boolean | undefined }
>(function NavigationMenuLink({ className, asChild = false, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      asChild={asChild}
      className={cn(
        "block select-none rounded-none p-2 text-ui text-fg no-underline outline-none transition-colors",
        "data-[active]:bg-accent-subtle data-[active]:text-fg",
        // The background is the hover/active signal. It is not enough on its own
        // for focus: a filled accent surface with no ring has no offset and no
        // shape, and it collides with `data-[active]`. The inset ring keeps the
        // two distinguishable without moving the layout.
        "focus-visible:bg-accent-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...dataSlot("navigation-menu", "link")}
      {...props}
    />
  );
});

function NavigationMenuViewport(): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "absolute start-0 top-full z-dropdown mt-1 w-[min(40rem,90vw)] origin-top border border-line bg-surface-2 p-2 shadow-overlay",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      )}
      {...dataSlot("navigation-menu", "viewport")}
    />
  );
}

/** A controlled-state helper exposed for products building their own nav. */
export { useControllableState };

/* -- Nav: the application navigation list ----------------------------------- */
export {
  MAIN_NAV_LABEL,
  Nav,
  NavItem,
  type NavItemData,
  type NavItemProps,
  type NavProps,
} from "./nav";

/* -- Sidebar: the frame the nav lives in ----------------------------------- */
export {
  Sidebar,
  SidebarContent,
  type SidebarBreakpoint,
  type SidebarContentProps,
  type SidebarProps,
} from "./sidebar";
