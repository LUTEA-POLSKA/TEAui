import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTableSort } from "../use-table-sort";

interface Server {
  name: string;
  status: string;
  disk: number;
}

const SERVERS: readonly Server[] = [
  { name: "srv-10", status: "online", disk: 62 },
  { name: "srv-2", status: "degraded", disk: 91 },
  { name: "mc-01", status: "offline", disk: 44 },
];

// A status column sorts by severity. Alphabetic order would rank "degraded"
// above "offline" above "online" and mean nothing to an operator.
const SEVERITY: Record<string, number> = { online: 0, degraded: 1, offline: 2 };

function setup(initial: Parameters<typeof useTableSort<Server, "name" | "status" | "disk">>[0]["initial"] = null) {
  const onChange = vi.fn();
  const view = renderHook(() =>
    useTableSort<Server, "name" | "status" | "disk">({
      columns: {
        name: (row) => row.name,
        status: (row) => SEVERITY[row.status] ?? 99,
        disk: (row) => row.disk,
      },
      initial,
      onChange,
    }),
  );
  return { ...view, onChange };
}

describe("useTableSort", () => {
  it("starts unsorted and reports no aria-sort for any column", () => {
    const { result } = setup();

    expect(result.current.sort).toBeNull();
    expect(result.current.ariaSortFor("name")).toBeUndefined();
    expect(result.current.directionFor("name")).toBe("none");
    expect(result.current.activeFor("name")).toBe(false);
  });

  it("keeps the original order while unsorted", () => {
    const { result } = setup();

    expect(result.current.sorted(SERVERS).map((row) => row.name)).toEqual([
      "srv-10",
      "srv-2",
      "mc-01",
    ]);
  });

  it("sorts a string column ascending on the first click", () => {
    const { result } = setup();

    act(() => result.current.toggle("name"));

    expect(result.current.ariaSortFor("name")).toBe("ascending");
    // Numeric collation: "srv-2" before "srv-10". Default collation would rank
    // them the other way and read as a bug.
    expect(result.current.sorted(SERVERS).map((row) => row.name)).toEqual([
      "mc-01",
      "srv-2",
      "srv-10",
    ]);
  });

  it("sorts a numeric column numerically, not as text", () => {
    const { result } = setup();

    act(() => result.current.toggle("disk"));

    expect(result.current.sorted(SERVERS).map((row) => row.disk)).toEqual([44, 62, 91]);
  });

  it("uses the caller's accessor, so severity beats the alphabet", () => {
    const { result } = setup();

    act(() => result.current.toggle("status"));

    expect(result.current.sorted(SERVERS).map((row) => row.status)).toEqual([
      "online",
      "degraded",
      "offline",
    ]);
  });

  it("reverses on the second click", () => {
    const { result } = setup();

    act(() => result.current.toggle("disk"));
    act(() => result.current.toggle("disk"));

    expect(result.current.ariaSortFor("disk")).toBe("descending");
    expect(result.current.sorted(SERVERS).map((row) => row.disk)).toEqual([91, 62, 44]);
  });

  it("returns to unsorted on the third click, and omits aria-sort again", () => {
    const { result } = setup();

    act(() => result.current.toggle("name"));
    act(() => result.current.toggle("name"));
    act(() => result.current.toggle("name"));

    // This is the state `TableHead` needs to exist: with no way back to
    // unsorted, `aria-sort` could never be omitted again once set.
    expect(result.current.sort).toBeNull();
    expect(result.current.ariaSortFor("name")).toBeUndefined();
    expect(result.current.sorted(SERVERS).map((row) => row.name)).toEqual([
      "srv-10",
      "srv-2",
      "mc-01",
    ]);
  });

  it("claims exactly one column at a time", () => {
    const { result } = setup();

    act(() => result.current.toggle("name"));
    act(() => result.current.toggle("disk"));

    // Two heads claiming a sort is what the Showcase's table did: the first
    // column hard-coded `active`, so a second click produced two sorted heads.
    expect(result.current.activeFor("name")).toBe(false);
    expect(result.current.activeFor("disk")).toBe(true);
    expect(result.current.ariaSortFor("name")).toBeUndefined();
    expect(result.current.ariaSortFor("disk")).toBe("ascending");
  });

  it("starts a newly chosen column ascending rather than inheriting the direction", () => {
    const { result } = setup();

    act(() => result.current.toggle("disk"));
    act(() => result.current.toggle("disk"));
    act(() => result.current.toggle("name"));

    expect(result.current.ariaSortFor("name")).toBe("ascending");
  });

  it("reports every transition to onChange, including the return to unsorted", () => {
    const { result, onChange } = setup();

    act(() => result.current.toggle("name"));
    act(() => result.current.toggle("name"));
    act(() => result.current.toggle("name"));

    expect(onChange.mock.calls.map(([next]) => next)).toEqual([
      { column: "name", direction: "asc" },
      { column: "name", direction: "desc" },
      null,
    ]);
  });

  it("fires onChange once per click, even under StrictMode double-rendering", () => {
    const onChange = vi.fn();
    const { result } = renderHook(
      () =>
        useTableSort<Server, "name">({
          columns: { name: (row) => row.name },
          onChange,
        }),
      { wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode> },
    );

    act(() => result.current.toggle("name"));

    // A `setState` updater with a side effect runs twice under StrictMode. The
    // transition is computed outside the updater precisely so this stays 1.
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("never mutates or aliases the caller's array", () => {
    const { result } = setup();
    const input = [...SERVERS];

    act(() => result.current.toggle("name"));
    const output = result.current.sorted(input);

    expect(input.map((row) => row.name)).toEqual(["srv-10", "srv-2", "mc-01"]);
    expect(output).not.toBe(input);
  });

  it("honours an initial sort", () => {
    const { result } = setup({ column: "disk", direction: "desc" });

    expect(result.current.ariaSortFor("disk")).toBe("descending");
    expect(result.current.sorted(SERVERS).map((row) => row.disk)).toEqual([91, 62, 44]);
  });
});
