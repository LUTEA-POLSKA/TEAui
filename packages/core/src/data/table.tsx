import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — Table.
 *
 * Kill-list entry 14 in `docs/audit/CONSOLIDATION.md`: two kit users and ten raw
 * tables in one project, one pseudo-list in the other, and neither had a wrapper
 * that could scroll. Three defects are fixed structurally here rather than by
 * convention:
 *
 *  - **The head height and the cell height disagreed.** One project styled its
 *    head `h-12 px-4` against cells at `p-4`, so column one was misaligned
 *    because `px-4` is not `p-4`. Head and cell now draw from the same
 *    `cell-x`/`cell-y` density steps, so they cannot drift.
 *  - **No horizontal overflow container.** A table wider than its column either
 *    clipped or pushed the whole page sideways. `Table` owns the scroll region
 *    and marks it `role="region"` with a label, which is what makes it
 *    keyboard-scrollable.
 *  - **The head was a `div`.** `TableHeader` is a real `<thead>` and every
 *    `TableHead` carries `scope="col"`, so a screen reader can announce the
 *    column a cell belongs to. That was missing in both source projects.
 *
 * A `Table` is still a `<table>`. It is not a `div` with `role="table"`, and it
 * does not take `display: grid` — a real table is what gives a screen reader
 * the row/column relationship for free.
 */

/* -------------------------------------------------------------------------- */
/* The scroll region: the wrapper owns overflow, not the table                 */
/* -------------------------------------------------------------------------- */

export interface TableProps extends React.ComponentProps<"div"> {
  /**
   * Accessible name for the scroll region. Required by contract, not optional:
   * a scrollable region with no name is a keyboard trap a screen-reader user
   * cannot escape, because they are told to scroll and not told what by.
   */
  label: string;
  /** Keep the head visible while the body scrolls. */
  stickyHeader?: boolean | undefined;
  /** Zebra striping. Off by default — density already carries the rhythm. */
  striped?: boolean | undefined;
  className?: string | undefined;
}

/**
 * The scroll region tells its head whether to stick. A `Table` that scrolled
 * without a sticky head hides the very row that says which column you are
 * looking at, and a head that stuck without a scroll container pins itself to
 * the page instead of the table. The two are one decision, so it is one prop
 * and it is owned by the parent — a consumer never sets it twice.
 */
const TableStickyContext = React.createContext(false);

export const Table = React.forwardRef<HTMLDivElement, TableProps>(function Table(
  { label, stickyHeader = false, striped = false, className, children, ...props },
  ref,
) {
  return (
    <TableStickyContext.Provider value={stickyHeader}>
      <div
        ref={ref}
        // A scrollable region needs to be reachable and announced. `tabIndex` makes
        // it keyboard-scrollable; the label is what it is announced as.
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          "w-full overflow-x-auto",
          // The focus ring is on the region, so it must not be clipped by the
          // parent's own overflow.
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        {...dataSlot("table", "region")}
        {...props}
      >
        <table
          className={cn("w-full border-collapse text-ui", striped && "[&_tbody_tr:nth-child(even)]:bg-surface-2/40")}
          {...dataSlot("table")}
          {...(stickyHeader ? { "data-sticky-header": "true" as const } : {})}
        >
          {children}
        </table>
      </div>
    </TableStickyContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* The five sections                                                           */
/* -------------------------------------------------------------------------- */

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"thead">
>(function TableHeader({ className, ...props }, ref) {
  const sticky = React.useContext(TableStickyContext);
  return (
    <thead
      ref={ref}
      className={cn(
        "border-b border-line-strong text-label",
        // `text-label` is already uppercase, tracked and semibold at 11px, so
        // the head and the micro-label are one token doing two jobs rather than
        // two class strings that can drift apart.
        //
        // `bg-surface` is required, not cosmetic: a sticky head that scrolls
        // content *under* itself is transparent over the rows passing beneath it.
        sticky && "sticky top-0 z-raised bg-surface",
        className,
      )}
      {...dataSlot("table", "header")}
      {...props}
    />
  );
});

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tbody">>(
  function TableBody({ className, ...props }, ref) {
    return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...dataSlot("table", "body")} {...props} />;
  },
);

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tfoot">>(
  function TableFooter({ className, ...props }, ref) {
    return (
      <tfoot
        ref={ref}
        className={cn("border-t border-line-strong text-micro text-fg-muted", className)}
        {...dataSlot("table", "footer")}
        {...props}
      />
    );
  },
);

export const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<"tr"> & {
  /** Marks the row a selection checkbox belongs to. */
  selected?: boolean | undefined;
}>(function TableRow({ className, selected = false, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-line transition-colors",
        "hover:bg-surface-2 data-[selected]:bg-accent-subtle",
        className,
      )}
      {...dataSlot("table", "row")}
      {...stateAttributes({ selected })}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Cells                                                                       */
/* -------------------------------------------------------------------------- */

export interface TableHeadProps extends Omit<React.ComponentProps<"th">, "color"> {
  /**
   * Sort direction. Passing it is what makes the header announceable as a
   * column: `aria-sort` lives here and nowhere else. Omit it for a column that
   * cannot be sorted — a permanently present `aria-sort="none"` announces
   * "not sorted" on every cell of every table, which is noise.
   */
  sort?: "ascending" | "descending" | undefined;
  className?: string | undefined;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, sort, scope = "col", ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      scope={scope}
      {...(sort ? { "aria-sort": sort } : {})}
      className={cn(
        "h-[length:var(--tea-row-h)] px-[length:var(--tea-cell-px)] text-start align-middle",
        "font-semibold uppercase tracking-wider text-label text-fg-muted",
        className,
      )}
      {...dataSlot("table", "head")}
      {...props}
    />
  );
});

export interface TableSortButtonProps extends Omit<React.ComponentProps<"button">, "color"> {
  /** Which way this click would sort. Drives the glyph and the state. */
  direction?: "ascending" | "descending" | "none" | undefined;
  /**
   * The current sort, when the parent owns it. The button then reports
   * `aria-sort` through the head, not through itself, and only needs this to
   * render the correct glyph.
   */
  active?: boolean | undefined;
  className?: string | undefined;
}

/**
 * The clickable affordance inside a sortable `TableHead`.
 *
 * It is a separate component rather than an `asChild` on `TableHead` because of
 * what the audit found: a column header must stay a `<th>` so it can carry
 * `scope` and `aria-sort`, and the control has to live *inside* it. Replacing
 * the `<th>` with a `<button>` produces a `<tr>` whose child is a button —
 * invalid HTML, and a screen reader loses the column it belongs to. So the
 * division of labour is: the head is the semantic claim, the button is the
 * action, and the region between them is sorted by neither.
 */
export const TableSortButton = React.forwardRef<HTMLButtonElement, TableSortButtonProps>(
  function TableSortButton({ className, direction = "none", active = false, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "-mx-1 inline-flex items-center gap-1 px-1",
          "transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          active ? "text-fg" : "text-fg-muted",
          className,
        )}
        // The button's own accessible name is its column name; the sort state is
        // the head's `aria-sort`, so announcing it twice would be noise.
        data-tea-touch
        {...dataSlot("table", "sort")}
        {...props}
      >
        {children}
        <span aria-hidden="true" className="text-micro">
          {direction === "ascending" ? "↑" : direction === "descending" ? "↓" : "↕"}
        </span>
      </button>
    );
  },
);

export interface TableCellProps extends Omit<React.ComponentProps<"td">, "color"> {
  /** Right-align for numbers. Tabular figures stop digits from jittering. */
  numeric?: boolean | undefined;
  className?: string | undefined;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, numeric = false, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      className={cn(
        "cell-y px-[length:var(--tea-cell-px)] align-middle text-fg",
        numeric && "text-end font-mono tabular-nums",
        className,
      )}
      {...dataSlot("table", "cell")}
      {...props}
    />
  );
});

/**
 * The caption is rendered as a real `<caption>` and visually hidden.
 *
 * Not optional decoration: a data table without a caption is a grid of numbers
 * with no subject, and an audit found tables that had neither a `caption`
 * nor a `scope` — the two attributes that make a table navigable at all.
 */
export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentProps<"caption">
>(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn("sr-only", className)} {...dataSlot("table", "caption")} {...props} />;
});

/* -------------------------------------------------------------------------- */
/* The empty row                                                               */
/* -------------------------------------------------------------------------- */

export interface TableEmptyRowProps extends React.ComponentProps<"tr"> {
  /** How many columns the table has, so the cell can span them. */
  colSpan: number;
  /** The message. Usually an `EmptyStateFiltered` or `EmptyStateNew`. */
  children: React.ReactNode;
}

/**
 * An empty table, as a row.
 *
 * The audit's rule — "without a hit, name the filter as the cause, not the
 * emptiness" — cannot be honoured by a component that only says "no data". So
 * this renders a full-width row with a dashed border, and it *takes* the message
 * as a child, because the message is a decision the caller makes with its
 * vocabulary. A component that invented the wording would be a German string in
 * a product that might want different words.
 */
export const TableEmptyRow = React.forwardRef<HTMLTableRowElement, TableEmptyRowProps>(
  function TableEmptyRow({ colSpan, className, children, ...props }, ref) {
    return (
      <tr ref={ref} className={cn("border-b-0", className)} {...dataSlot("table", "empty")} {...props}>
        <td
          colSpan={colSpan}
          className="p-0"
          // The cell is presentational: the message inside it carries the
          // meaning, and announcing an extra "cell, empty" is noise.
          role="presentation"
        >
          {children}
        </td>
      </tr>
    );
  },
);
