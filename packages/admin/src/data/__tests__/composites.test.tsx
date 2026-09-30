import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IconTile, CardGrid, CardGridItem } from "../composites";
import { RefreshButton } from "../refresh-button";
import { RowActions } from "../row-actions";

describe("IconTile", () => {
  it("hides itself from assistive technology by default", () => {
    const { container } = render(
      <IconTile>
        <svg />
      </IconTile>,
    );
    // A tile next to a product name would otherwise make a screen reader read
    // the glyph and the name as two things.
    expect(container.querySelector("span")).toHaveAttribute("aria-hidden", "true");
  });

  it("stays visible when it is the only content of a control", () => {
    const { container } = render(
      <IconTile standalone>
        <svg />
      </IconTile>,
    );
    expect(container.querySelector("span")).not.toHaveAttribute("aria-hidden");
  });

  it("cannot be given a name, because a named tile is announced twice", () => {
    const { container } = render(
      <IconTile>
        <svg />
      </IconTile>,
    );
    // `aria-label` is not in the props type, so a consumer cannot reach for it to
    // satisfy a linter and re-introduce the duplicated announcement.
    expect(container.querySelector("span")).not.toHaveAttribute("aria-label");
  });
});

describe("CardGrid", () => {
  it("is a list, so a screen reader can count it", () => {
    render(
      <CardGrid>
        <CardGridItem>srv-01</CardGridItem>
        <CardGridItem>srv-02</CardGridItem>
      </CardGrid>,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("RefreshButton", () => {
  it("is named, and named by the action rather than the glyph", () => {
    render(<RefreshButton onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button).toBeInTheDocument();
  });

  it("announces itself while refreshing and blocks a second activation", async () => {
    const onClick = vi.fn();
    render(<RefreshButton refreshing onClick={onClick} />);

    const button = screen.getByRole("button", { name: /Refresh/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    // Thirteen hand-written spin swaps is thirteen chances to forget that
    // repeat activation must be impossible while a save is in flight.
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps its label and its width while refreshing", () => {
    const { rerender } = render(<RefreshButton onClick={() => {}} />);
    rerender(<RefreshButton refreshing onClick={() => {}} />);
    // A label that swaps to "Lädt…" is announced twice and shifts the control.
    expect(screen.getByRole("button", { name: /Refresh/ })).toBeInTheDocument();
  });

  it("fires once per click when idle", async () => {
    const onClick = vi.fn();
    render(<RefreshButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("RowActions", () => {
  it("names the overflow button after the region, not after the button", async () => {
    render(
      <RowActions
        overflowLabel="Aktionen für srv-01"
        items={[{ label: "Neu starten", onSelect: () => {} }]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Aktionen für srv-01" });
    await userEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Neu starten" })).toBeInTheDocument();
  });

  it("runs a menu item's action", async () => {
    const onSelect = vi.fn();
    render(
      <RowActions
        overflowLabel="Aktionen für srv-01"
        items={[{ label: "Neu starten", onSelect }]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Aktionen für srv-01" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Neu starten" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("keeps the primary action outside the menu and named", () => {
    const onSelect = vi.fn();
    render(
      <RowActions
        overflowLabel="Aktionen für srv-01"
        primary={{ label: "Server öffnen", onSelect }}
        items={[{ label: "Neu starten", onSelect: () => {} }]}
      />,
    );

    // The audit found five unnamed icon buttons per row. `label` is a required
    // prop, so this cannot compile without one.
    expect(screen.getByRole("button", { name: "Server öffnen" })).toBeInTheDocument();
  });

  it("renders no overflow trigger when there is nothing to overflow", () => {
    const { container } = render(<RowActions overflowLabel="Aktionen für srv-01" />);
    // An overflow button that opens an empty menu is a dead control.
    expect(container.querySelector("button")).toBeNull();
  });

  it("honours a disabled menu item", async () => {
    render(
      <RowActions
        overflowLabel="Aktionen für srv-01"
        items={[{ label: "Neu starten", onSelect: () => {}, disabled: true }]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Aktionen für srv-01" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Neu starten" })).toHaveAttribute("data-disabled");
    });
  });
});
