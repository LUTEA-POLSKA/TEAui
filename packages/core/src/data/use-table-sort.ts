import * as React from "react";

/**
 * TEA UI — the sorting state machine for `Table`.
 *
 * `Table` is deliberately presentational: the head is the semantic claim
 * (`<th scope>`, `aria-sort`), `TableSortButton` is the action, and neither of
 * them knows what the data looks like. That split is right, and it has a cost
 * that the audit made visible.
 *
 * The audit's table line records: *"sorting exists end-to-end in the API and is
 * simply not wired up"*, and the kit's own answer listed **"no sorting"** as a
 * capability the library did not provide. So every product that shipped a
 * sortable table hand-wrote the same state — and the Showcase's own table was
 * proof that this goes wrong in a way nobody notices:
 *
 *  - the sort button moved a glyph while the rows stayed in their original
 *    order, because the state was never connected to the comparator;
 *  - one column hard-coded `active direction="ascending"`, so after clicking a
 *    second column two heads claimed to be sorted at once;
 *  - `aria-sort` was never passed to `TableHead` at all, so a screen-reader user
 *    got no sort state from any of it;
 *  - the docs example shipped a `TableSortButton` with no `onClick` — an inert
 *    button, in the one place people copy from.
 *
 * None of those are styling mistakes, and none of them are fixed by a lint rule.
 * They are the same state machine, written again. So it is solved once, here.
 *
 * What this owns: which column is sorted, which way, and what a click does next.
 * What it deliberately does not own: the comparator. Comparing rows is domain
 * knowledge — a `status` column sorts by severity, not alphabetically — so the
 * caller declares how each column reads, once, in `columns`.
 */

export type TableSortDirection = "asc" | "desc";

/** The current sort. `null` is a real state, not an absence: unsorted. */
export interface TableSortState<C extends string = string> {
  column: C;
  direction: TableSortDirection;
}

export interface UseTableSortOptions<T, C extends string> {
  /**
   * How each sortable column reads its value, keyed by column id.
   *
   * Declaring a column is what makes it sortable. A column that is absent has no
   * `toggle`, so it cannot grow a button that does nothing — which is how an
   * inert sort affordance gets into a table in the first place. Return a number
   * for numeric columns and a string for everything else; the comparator picks
   * the right comparison from the return type.
   */
  columns: Record<C, (row: T) => string | number>;
  /** Sort on first render. `null` (the default) starts unsorted. */
  initial?: TableSortState<C> | null | undefined;
  /** Notified on every change, including the return to unsorted. */
  onChange?: ((next: TableSortState<C> | null) => void) | undefined;
}

export interface UseTableSortResult<T, C extends string> {
  /** Current sort state, or `null` when unsorted. */
  sort: TableSortState<C> | null;
  /**
   * The click handler for a head.
   *
   * Same column cycles **ascending → descending → unsorted**; a different column
   * starts that column ascending. The third state is not decoration: `TableHead`
   * omits `aria-sort` entirely when unsorted, because a permanent
   * `aria-sort="none"` announces "not sorted" on every head of every table and
   * is noise. Without a way to *get back* to unsorted, that omission would be
   * a one-way door.
   */
  toggle: (column: C) => void;
  /** Pass to `TableHead`'s `sort` prop. `undefined` for unsorted columns. */
  ariaSortFor: (column: C) => "ascending" | "descending" | undefined;
  /** Pass to `TableSortButton`'s `direction` — drives the glyph. */
  directionFor: (column: C) => "ascending" | "descending" | "none";
  /** Pass to `TableSortButton`'s `active`. */
  activeFor: (column: C) => boolean;
  /**
   * The rows in sort order. Original order when unsorted.
   *
   * Always returns a new array, so the result can be memoised or kept without
   * aliasing the caller's data.
   */
  sorted: (rows: readonly T[]) => T[];
}

/**
 * Compares two cell values by their runtime type.
 *
 * Strings get `numeric` collation so `srv-2` sorts before `srv-10` — the default
 * collation puts `srv-10` first, which reads as a bug in every product that
 * pads its ids. `sensitivity: "base"` makes case irrelevant, so a re-cased
 * hostname cannot reshuffle rows between renders.
 */
function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function useTableSort<T, C extends string>({
  columns,
  initial = null,
  onChange,
}: UseTableSortOptions<T, C>): UseTableSortResult<T, C> {
  const [sort, setSort] = React.useState<TableSortState<C> | null>(initial);

  const toggle = React.useCallback(
    (column: C): void => {
      // Computed from the rendered `sort` rather than inside a `setState`
      // updater: an updater must be pure, and `onChange` is a side effect that
      // StrictMode would otherwise fire twice per click.
      const next: TableSortState<C> | null =
        sort?.column === column
          ? sort.direction === "asc"
            ? { column, direction: "desc" }
            : null
          : { column, direction: "asc" };
      setSort(next);
      onChange?.(next);
    },
    [onChange, sort],
  );

  const ariaSortFor = React.useCallback(
    (column: C): "ascending" | "descending" | undefined => {
      if (sort?.column !== column) {
        return undefined;
      }
      return sort.direction === "asc" ? "ascending" : "descending";
    },
    [sort],
  );

  const directionFor = React.useCallback(
    (column: C): "ascending" | "descending" | "none" =>
      ariaSortFor(column) === "ascending"
        ? "ascending"
        : ariaSortFor(column) === "descending"
          ? "descending"
          : "none",
    [ariaSortFor],
  );

  const activeFor = React.useCallback(
    (column: C): boolean => sort?.column === column,
    [sort],
  );

  const sorted = React.useCallback(
    (rows: readonly T[]): T[] => {
      if (!sort) {
        return rows.slice();
      }
      const read = columns[sort.column];
      const factor = sort.direction === "asc" ? 1 : -1;
      // `slice` before `sort` because the input is the caller's state and
      // `Array.prototype.sort` mutates in place.
      return rows.slice().sort((a, b) => factor * compareValues(read(a), read(b)));
    },
    [columns, sort],
  );

  return { sort, toggle, ariaSortFor, directionFor, activeFor, sorted };
}
