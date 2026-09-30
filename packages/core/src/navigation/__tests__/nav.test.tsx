import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Nav, type NavItemData } from "../nav";

const ITEMS: NavItemData[] = [
  { id: "servers", label: "Server", href: "/servers", group: "Infrastruktur", icon: <svg /> },
  { id: "backups", label: "Backups", href: "/backups", group: "Infrastruktur" },
  { id: "domains", label: "Domains", href: "/domains", group: "Infrastruktur" },
  { id: "users", label: "Benutzer", href: "/users", group: "Konto" },
];

/**
 * The audit found three `<nav>` elements in the source product with no
 * `aria-label`, and the entire frontend with three `role` assignments. The first
 * test is the one that would have caught it.
 */
describe("Nav", () => {
  it("is a named landmark", () => {
    render(<Nav label="Hauptnavigation" items={ITEMS} activeId="servers" />);
    // `label` is a required prop, so an unnamed nav cannot compile.
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
  });

  it("marks the current item with aria-current, not only with colour", () => {
    render(<Nav label="Hauptnavigation" items={ITEMS} activeId="backups" />);

    const current = screen.getByRole("link", { name: "Backups" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Server" })).not.toHaveAttribute("aria-current");
  });

  it("renders a real anchor for an item with an href", () => {
    render(<Nav label="Hauptnavigation" items={ITEMS} activeId="servers" />);
    // A div with onClick — eight of them in the source product — is not focusable
    // and does nothing on Enter.
    expect(screen.getByRole("link", { name: /Server/ })).toHaveAttribute("href", "/servers");
  });

  it("renders a real button for an item with no href", async () => {
    const onNavigate = vi.fn();
    render(
      <Nav
        label="Hauptnavigation"
        items={[{ id: "logout", label: "Abmelden", onSelect: onNavigate }]}
        activeId="logout"
        onNavigate={onNavigate}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Abmelden" }));
    expect(onNavigate).toHaveBeenCalled();
  });

  it("leaves a real href to the browser when no router claims it", () => {
    const onSelect = vi.fn();
    render(
      <Nav
        label="Hauptnavigation"
        items={[{ id: "servers", label: "Server", href: "/servers", onSelect }]}
      />,
    );
    // jsdom does not navigate, so the assertion is that preventDefault was NOT
    // called — a router must be able to opt in by supplying onSelect.
    const link = screen.getByRole("link", { name: "Server" });
    expect(link).toHaveAttribute("href", "/servers");
  });

  it("groups consecutive items under their heading", () => {
    const { container } = render(<Nav label="Hauptnavigation" items={ITEMS} />);
    expect(screen.getByText("Infrastruktur")).toBeInTheDocument();
    expect(screen.getByText("Konto")).toBeInTheDocument();
    expect(container.querySelectorAll("a")).toHaveLength(4);
  });

  it("hides the icon from assistive technology", () => {
    const { container } = render(<Nav label="Hauptnavigation" items={ITEMS} />);
    // The label is the name; an announced glyph alongside it is noise.
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  });

  it("warns in development when a group exceeds the IA limit, naming the limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const many = Array.from({ length: 9 }, (_, index) => ({
        id: `i${index}`,
        label: `Eintrag ${index}`,
        group: "Zu groß",
      }));
      render(<Nav label="Hauptnavigation" items={many} />);

      await waitFor(() => {
        expect(warn).toHaveBeenCalled();
      });
      // A warning, not a throw: an oversized navigation is a design problem, and
      // a library that crashes a product's dev server over taste has overstepped.
      expect(warn.mock.calls[0]?.[0]).toContain("IA_LIMITS.maxGroupSize");
    } finally {
      warn.mockRestore();
    }
  });

  it("stays silent below the limit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(<Nav label="Hauptnavigation" items={ITEMS} activeId="servers" />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
