import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterBar } from "../filters/filter-bar";

describe("FilterBar", () => {
  it("names the group, so the row is reachable by structure", () => {
    render(<FilterBar label="Filter orders" matchCount={12} />);
    expect(screen.getByRole("group", { name: "Filter orders" })).toBeDefined();
  });

  it("announces the match count, because it changes while the user types", () => {
    render(<FilterBar label="Filter" matchCount={12} />);
    const count = screen.getByRole("status");
    expect(count.getAttribute("aria-live")).toBe("polite");
    expect(count.textContent).toBe("12 matches");
  });

  it("reads as a share when a total is known — \"12\" alone does not say whether anything is left", () => {
    render(<FilterBar label="Filter" matchCount={12} totalCount={340} />);
    expect(screen.getByRole("status").textContent).toBe("12 of 340");
  });

  it("uses the singular for one match rather than shipping \"1 matches\"", () => {
    render(<FilterBar label="Filter" matchCount={1} />);
    expect(screen.getByRole("status").textContent).toBe("1 match");
  });

  it("keeps the count in the bar, not in the empty state it would disappear into", () => {
    render(<FilterBar label="Filter" matchCount={0} active onReset={() => {}} />);
    // A filtered-to-zero list is exactly where "0 matches" gets hidden. The bar
    // has no empty state, so the count cannot move out of it.
    expect(screen.getByRole("status").textContent).toBe("0 matches");
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeNull();
  });

  it("shows no Reset while no filter is active", () => {
    render(<FilterBar label="Filter" matchCount={340} onReset={() => {}} />);
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });

  it("shows Reset and calls back once a filter is active", async () => {
    const onReset = vi.fn();
    render(<FilterBar label="Filter" matchCount={12} active onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("renders no Reset button it cannot wire up", () => {
    // `active` without `onReset` would otherwise produce a Reset that does
    // nothing, which is worse than no Reset: it promises a way out and is not one.
    render(<FilterBar label="Filter" matchCount={12} active />);
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });

  it("lets a product replace the count text for its own plural rules", () => {
    render(
      <FilterBar
        label="Filter"
        matchCount={12}
        formatMatchCount={(n) => `${n} Treffer`}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("12 Treffer");
  });

  it("renders the controls it was given, unchanged", () => {
    render(
      <FilterBar label="Filter" matchCount={1}>
        <button type="button">Sort by date</button>
      </FilterBar>,
    );
    expect(screen.getByRole("button", { name: "Sort by date" })).toBeDefined();
  });
});