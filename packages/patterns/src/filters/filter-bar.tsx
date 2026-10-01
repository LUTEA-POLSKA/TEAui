import * as React from "react";
import { Button, dataSlot } from "@tea-ui/core";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

/**
 * TEA UI Patterns — FilterBar.
 *
 * A filter row for a list that stays on screen while it is filtered.
 *
 * The audit found this row rebuilt in every product, and the reason was never
 * the controls: it was the three questions the controls cannot answer. Where does
 * the match count go? When does Reset appear? What happens to the space when the
 * bar wraps on a narrow window? Every copy answered them differently, and the
 * two answers that were actually *wrong* were invisible in a screenshot.
 *
 * **The count sits here, not in the empty state.** A filtered-to-zero list has
 * an empty state, and the tempting place for "0 matches" is inside it. That
 * makes the count disappear exactly when the user needs it most, and it says
 * "no results" to someone who has not yet noticed that the filter they just
 * typed is what removed everything. Beside the filter, the causal chain —
 * *I typed, the count dropped* — stays visible.
 *
 * **The count is a live region.** It changes while the user types, and a screen
 * reader user gets no other signal that the list narrowed. `<output>` carries an
 * implicit `role="status"`, so the announcement does not depend on the consumer
 * remembering to add `aria-live`.
 *
 * **Reset is bound to `active`, not to "a filter was typed".** The contract is
 * that Reset is visible *as long as* a filter is active. A bar that shows Reset
 * because the input is non-empty, and hides it when the user deletes the text
 * back to empty, gets the timing wrong: the input is empty but the *filter* is
 * still narrowing the list, and the user is left with no way back.
 *
 * What this deliberately does not own: **where filter state lives.** Keeping it
 * in the URL is the contract, and it belongs to the product's router — a pattern
 * that imported a router would be unusable outside a routing framework. The
 * obligation is documented, not enforced.
 */

export interface FilterBarProps extends Omit<React.ComponentProps<"div">, "children"> {
  children?: React.ReactNode;
  /**
   * Name for the group. **Required** — the audit found filter rows announced as
   * an unnamed group, so a screen reader user navigating by landmark had nothing
   * to attach the row to.
   */
  label: string;
  /** How many entries the current filters match. */
  matchCount: number;
  /**
   * How many entries exist before filtering. When given, the count reads
   * "12 of 340", which answers a question "12" alone does not: whether anything
   * is left to find, or the filter is nearly everything.
   */
  totalCount?: number;
  /**
   * Whether a filter is currently narrowing the list. Drives the Reset button.
   * Empty input with a filter still applied is `active` — see the file header.
   */
  active?: boolean;
  /**
   * Called by Reset. The button renders only when this **and** `active` are set,
   * because a Reset button that does nothing is worse than no Reset button.
   */
  onReset?: () => void;
  /**
   * Replaces the count text entirely, for products whose plural rules or
   * phrasing differ. Receives both counts so it can ignore the second.
   */
  formatMatchCount?: (matchCount: number, totalCount: number | undefined) => string;
}

function defaultMatchCount(matchCount: number, totalCount: number | undefined): string {
  if (totalCount !== undefined) {
    return `${matchCount} ${COPY.a11y.of} ${totalCount}`;
  }
  return matchCount === 1
    ? COPY.a11y.matchesOne
    : COPY.a11y.matchesMany.replace("{count}", String(matchCount));
}

/**
 * @example
 * ```tsx
 * <FilterBar label="Filter" matchCount={12} totalCount={340} active onReset={clear}>
 *   <SearchInput aria-label="Search" value={query} onChange={setQuery} />
 *   <Select aria-label="Status" value={status} onChange={setStatus} options={statuses} />
 * </FilterBar>
 * ```
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  {
    children,
    className,
    label,
    matchCount,
    totalCount,
    active = false,
    onReset,
    formatMatchCount = defaultMatchCount,
    ...props
  },
  ref,
) {
  const text = React.useMemo(
    () => formatMatchCount(matchCount, totalCount),
    [formatMatchCount, matchCount, totalCount],
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-tea-touch
      className={cn(
        // Wrapping rather than scrolling: a filter row that scrolls sideways
        // hides the Reset behind the fold, and the contract wants Reset visible
        // for as long as a filter is active.
        "flex flex-wrap items-center gap-2",
        className,
      )}
      {...dataSlot("filter-bar")}
      {...props}
    >
      {children}
      <output
        // `<output>` is role="status" implicitly; aria-live spells out that the
        // count is expected to change under the user's hands while typing.
        aria-live="polite"
        className={cn("text-ui text-fg-muted tabular-nums", totalCount === undefined && "ms-auto")}
        {...dataSlot("filter-bar-count")}
      >
        {text}
      </output>
      {active && onReset ? (
        <Button variant="ghost" size="sm" onClick={onReset} {...dataSlot("filter-bar-reset")}>
          {COPY.actions.reset}
        </Button>
      ) : null}
    </div>
  );
});