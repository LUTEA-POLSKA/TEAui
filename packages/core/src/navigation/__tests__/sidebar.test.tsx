import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Sidebar, SidebarContent, type NavItemData } from "../sidebar";

const ITEMS: NavItemData[] = [
  { id: "uebersicht", label: "Übersicht", href: "#/a", group: "Allgemein" },
  { id: "server", label: "Server", href: "#/a", group: "Allgemein" },
  { id: "backup", label: "Backups", href: "#/a", group: "Daten" },
];

/**
 * Kill-list entry 16. The mobile copy in the source products was a *second
 * re-render* of the navigation that dropped `aria-current` and the global search.
 * That failure mode is only possible while the content is not a part you can
 * render twice — so these tests are about the part existing at all.
 */
describe("Sidebar", () => {
  it("is a complementary landmark with a name", () => {
    const { container } = render(<Sidebar label="Hauptnavigation" items={ITEMS} activeId="server" />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    // Three nav groups with no name in one product: the audit's S1c finding.
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(container.querySelector("aside")).toBeInTheDocument();
  });

  it("carries aria-current on the active item", () => {
    render(<Sidebar label="Hauptnavigation" items={ITEMS} activeId="server" />);
    expect(screen.getByRole("link", { name: "Server" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Übersicht" })).not.toHaveAttribute("aria-current");
  });

  it("is hidden below its breakpoint and shown above it", () => {
    const { container } = render(
      <Sidebar label="Hauptnavigation" items={ITEMS} breakpoint="lg" />,
    );
    const aside = container.querySelector("aside")!;
    // `hidden` is the base; the breakpoint class reveals it. The audit marked
    // this width `DECISION REQUIRED` — it is a product decision, so it is a prop.
    expect(aside).toHaveClass("hidden");
    expect(aside).toHaveClass("lg:flex");
    expect(aside).toHaveAttribute("data-sidebar-breakpoint", "lg");
  });

  it("emits a class Tailwind can actually extract", () => {
    // A class assembled at runtime is never generated, and produces no CSS at
    // all. The lookup table keeps every string visible to the scanner.
    for (const breakpoint of ["sm", "md", "lg", "xl"] as const) {
      const { container, unmount } = render(
        <Sidebar label="Hauptnavigation" items={ITEMS} breakpoint={breakpoint} />,
      );
      expect(container.querySelector("aside")).toHaveClass(`${breakpoint}:flex`);
      unmount();
    }
  });

  it("keeps the footer reachable, so the nav scrolls and not the sidebar", () => {
    const { container } = render(
      <Sidebar label="Hauptnavigation" items={ITEMS} footer={<span>Abmelden</span>} />,
    );
    // `min-h-0` on the scroll region is load-bearing: a flex child defaults to
    // `min-height: auto` and refuses to shrink, pushing the footer off-screen.
    const scroller = container.querySelector(".overflow-y-auto");
    expect(scroller).toHaveClass("min-h-0");
    expect(screen.getByText("Abmelden")).toBeInTheDocument();
  });

  /**
   * The point of the split. A product's mobile drawer needs the content without
   * the `<aside>`, and it must come from the same array.
   */
  it("renders the same content twice without a second nav implementation", () => {
    const { rerender } = render(<Sidebar label="Hauptnavigation" items={ITEMS} activeId="server" />);
    expect(screen.getAllByRole("link")).toHaveLength(3);

    // The drawer copy: same items, same `aria-current`, no `<aside>`.
    rerender(<SidebarContent label="Hauptnavigation" items={ITEMS} activeId="server" />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Server" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("carries the before-nav slot, so a search exists in both shells", () => {
    const search = <input aria-label="Global suchen" type="search" />;
    const { container } = render(
      <Sidebar label="Hauptnavigation" items={ITEMS} beforeNav={search} />,
    );
    // The audit's sharpest finding: a global search that was unreachable below
    // 1024px, because only the desktop copy had it.
    expect(screen.getByRole("searchbox", { name: "Global suchen" })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tea-sidebar-content"]')).not.toBeNull();
  });

  it("forwards navigation to the consumer when a router claims it", async () => {
    const onNavigate = vi.fn();
    // A plain `href` without `onSelect` is left to the browser — that is the
    // documented contract, and it is what makes a real `Ctrl`-click work. The
    // router claims the item by supplying `onSelect`.
    render(
      <Sidebar
        label="Hauptnavigation"
        activeId="server"
        onNavigate={onNavigate}
        items={[
          ...ITEMS,
          { id: "neustart", label: "Neustart", onSelect: () => onNavigate("neustart") },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Neustart" }));
    expect(onNavigate).toHaveBeenCalledWith("neustart");
  });

  it("leaves a plain href to the browser", () => {
    const onNavigate = vi.fn();
    render(<Sidebar label="Hauptnavigation" items={ITEMS} activeId="server" onNavigate={onNavigate} />);
    const link = screen.getByRole("link", { name: "Backups" });
    // The href survives, and `onNavigate` is not pre-empted: a user who
    // middle-clicks or ctrl-clicks a router link must still get a new tab.
    expect(link).toHaveAttribute("href", "#/a");
  });
});

  describe("header band", () => {
    it("takes its vertical height from the header, so its divider lines up", () => {
      // This was a visible step in the browser and no test caught it, because
      // both rules looked reasonable on their own: `Sidebar` padded its header
      // `p-3`, and `AdminShell` declared a `h-14` top bar beside it. The sidebar's
      // divider therefore sat at 56 + 24 = 80px and the page's at 56px.
      //
      // The invariant is that the band adds padding on the inline axis only. If
      // someone makes this `p-3` again to space a header that needs it, the
      // header owns its own padding instead — and this test says why.
      render(<Sidebar label="Main" items={ITEMS} activeId="server" header={<div />} />);
      const band = document.querySelector('[data-slot="tea-sidebar-content"] > div');
      expect(band?.className).toContain("px-3");
      expect(band?.className).not.toMatch(/(^|\s)p-3(\s|$)/);
      // The border is what has to line up, so it must still be there.
      expect(band?.className).toContain("border-b");
    });
  });
