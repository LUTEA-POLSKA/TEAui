import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionBar } from "../actions/action-bar";

/** DOM order of the buttons in the bar, by their visible label. */
function order(): string[] {
  return screen.getAllByRole("button").map((button) => button.textContent ?? "");
}

describe("ActionBar", () => {
  it("renders every action with its text label", () => {
    render(
      <ActionBar
        label="Row actions"
        actions={[{ label: "Edit" }, { label: "Archive" }, { label: "Delete", tone: "destructive" }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Archive" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("puts the destructive action last, whatever order the actions arrived in", () => {
    render(
      <ActionBar
        actions={[
          { label: "Delete", tone: "destructive" },
          { label: "Edit" },
          { label: "Duplicate" },
        ]}
      />,
    );
    expect(order()).toEqual(["Edit", "Duplicate", "Delete"]);
  });

  it("puts the primary action leftmost, whatever order the actions arrived in", () => {
    render(
      <ActionBar
        actions={[
          { label: "Duplicate" },
          { label: "Create", tone: "primary" },
          { label: "Edit", tone: "primary" },
        ]}
      />,
    );
    const labels = order();
    expect(labels.indexOf("Create")).toBeLessThan(labels.indexOf("Duplicate"));
    expect(labels.indexOf("Edit")).toBeLessThan(labels.indexOf("Duplicate"));
  });

  it("groups more than five actions instead of stacking them onto a second line", () => {
    const actions = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((label) => ({
      label,
    }));
    render(<ActionBar actions={actions} />);

    // Five render inline; the rest are reachable, but not on the row.
    expect(screen.getByRole("button", { name: "One" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Five" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Six" })).toBeNull();
    expect(screen.getByRole("button", { name: "More" })).toBeDefined();
  });

  it("puts the overflow back in reach when the menu opens", async () => {
    const onSelect = vi.fn();
    render(
      <ActionBar
        actions={[
          { label: "One" },
          { label: "Two" },
          { label: "Three" },
          { label: "Four" },
          { label: "Five" },
          { label: "Six", onSelect },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    const item = screen.getByRole("menuitem", { name: "Six" });
    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("never pushes a destructive action into the overflow menu, however full the bar is", () => {
    render(
      <ActionBar
        actions={[
          ...["One", "Two", "Three", "Four", "Five", "Six"].map((label) => ({ label })),
          { label: "Delete", tone: "destructive" as const },
        ]}
      />,
    );
    // A full bar is exactly the case where "Delete" would otherwise be the thing
    // that disappears, which is the mistake the left/right rule exists to stop.
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("names the group it wraps", () => {
    render(<ActionBar label="Row actions" actions={[{ label: "Edit" }]} />);
    expect(screen.getByRole("group", { name: "Row actions" })).toBeDefined();
  });

  it("calls the action back", async () => {
    const onSelect = vi.fn();
    render(<ActionBar actions={[{ label: "Edit", onSelect }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders nothing inline when there are no actions", () => {
    render(<ActionBar actions={[]} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});