import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PanelHeader } from "../panel-header";

describe("PanelHeader", () => {
  it("renders a real heading at the level it was given", () => {
    render(<PanelHeader level={3} title="Ressourcen" />);
    expect(screen.getByRole("heading", { level: 3, name: "Ressourcen" })).toBeInTheDocument();
  });

  it("hides the icon tile from assistive technology", () => {
    const { container } = render(<PanelHeader level={2} title="Ressourcen" icon={<svg />} />);
    // The title is the name; an announced glyph in front of it is noise.
    expect(container.querySelector("span[aria-hidden='true']")).not.toBeNull();
  });

  /**
   * The reason this component is a component and not a copy-paste. The audit's
   * note on the eight source sites: "it uses `rounded-md` — a radius-law
   * violation that survived 8 times."
   */
  it("never rounds the tile, because the radius law says 0", () => {
    const { container } = render(<PanelHeader level={2} title="Ressourcen" icon={<svg />} />);
    const tile = container.querySelector("span[aria-hidden='true']");
    expect(tile).toHaveClass("rounded-none");
    // `pill` is reserved for avatars, dots, switches, radios, media controls,
    // loaders and progress. A surface tile is none of those.
    expect(tile).not.toHaveClass("rounded-pill");
  });

  it("uses the 11px token for the description, not a 10px/11px class string", () => {
    const { container } = render(
      <PanelHeader level={2} title="Ressourcen" description="Aktuelle Messwerte" />,
    );
    const description = container.querySelector("p");
    expect(description).toHaveClass("text-label");
    // `text-[11px]` is one character away from 10px, and the audit found 10px
    // carrying real UI text in both source products.
    expect(description?.className).not.toMatch(/text-\[\d+px\]/);
  });

  it("scales the title with the level, so a page head and a section head differ", () => {
    const { container, rerender } = render(<PanelHeader level={1} title="Server" />);
    expect(container.querySelector("h1")).toHaveClass("text-section");

    rerender(<PanelHeader level={4} title="Server" />);
    expect(container.querySelector("h4")).toHaveClass("text-ui");
  });

  it("stamps the slot vocabulary on its parts", () => {
    const { container } = render(
      <PanelHeader level={2} title="Ressourcen" icon={<svg />} actions={<button type="button">Neu laden</button>} />,
    );
    expect(container.querySelector('[data-slot="tea-panel-header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tea-panel-header-icon"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tea-panel-header-actions"]')).not.toBeNull();
  });
});
