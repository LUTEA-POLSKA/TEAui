import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DesktopShell, type DesktopWindow } from "../desktop-shell";
import type { NavItemData } from "@tea-ui/core";

const NAV: NavItemData[] = [
  { id: "overview", label: "Overview", href: "#/overview" },
  { id: "servers", label: "Servers", href: "#/servers" },
];

function makeWindow(overrides: Partial<DesktopWindow> = {}) {
  return {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    ...overrides,
  } satisfies DesktopWindow;
}

function renderShell(props: Partial<Parameters<typeof DesktopShell>[0]> = {}) {
  const hostWindow = props.window ?? makeWindow();
  const utils = render(
    <DesktopShell
      product="MLHSM"
      tagline="Home Server Manager"
      platform="windows"
      window={hostWindow}
      nav={NAV}
      activeId="overview"
      {...props}
    >
      <p>The page</p>
    </DesktopShell>,
  );
  return { hostWindow, ...utils };
}

describe("DesktopShell", () => {
  describe("one band, not two", () => {
    it("puts the brand in the title bar, so there is no second header above the nav", () => {
      renderShell();
      // The regression this component exists to prevent: a brand band in the
      // sidebar *and* a top bar, which in a `decorations: false` window is two
      // stacked headers where a user expects one.
      const brand = screen.getByText("MLHSM");
      expect(brand.closest("header")).not.toBeNull();

      const nav = screen.getByRole("navigation", { name: "Main navigation" });
      expect(nav.closest("header")).toBeNull();
      // No empty band with a divider above the navigation either.
      expect(nav.previousElementSibling).toBeNull();
    });

    it("shows the tagline under the product name", () => {
      renderShell();
      expect(screen.getByText("Home Server Manager")).toBeDefined();
    });
  });

  describe("window controls", () => {
    it("calls each operation on its own button", async () => {
      const { hostWindow } = renderShell();
      await userEvent.click(screen.getByRole("button", { name: "Minimize" }));
      await userEvent.click(screen.getByRole("button", { name: "Maximize" }));
      await userEvent.click(screen.getByRole("button", { name: "Close window" }));

      expect(hostWindow.minimize).toHaveBeenCalledTimes(1);
      expect(hostWindow.toggleMaximize).toHaveBeenCalledTimes(1);
      expect(hostWindow.close).toHaveBeenCalledTimes(1);
    });

    it("never calls a control a plain \"Close\", because that names the dialog", () => {
      renderShell();
      // `actions.close` on a title bar tells a screen reader user the dialog is
      // dismissing. The window and a dialog are not the same thing.
      expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    });

    it("draws no controls on macOS, because the OS draws the traffic lights", () => {
      renderShell({ platform: "macos" });
      expect(screen.queryByRole("button", { name: "Minimize" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Close window" })).toBeNull();
    });

    it("reserves the leading edge for the macOS traffic lights", () => {
      renderShell({ platform: "macos" });
      const bar = screen.getByRole("banner");
      // 78px is the stock 1080p value; the prop exists because the real one
      // depends on the OS version and the display's scale factor.
      expect(bar.style.paddingInlineStart).toBe("78px");
    });

    it("reserves nothing on the platforms that draw their own controls", () => {
      renderShell({ platform: "windows" });
      expect(screen.getByRole("banner").style.paddingInlineStart).toBe("");
    });

    it("shows Restore instead of Maximize once the window is maximized", async () => {
      let listener: ((maximized: boolean) => void) | undefined;
      const { hostWindow } = renderShell({
        window: makeWindow({
          isMaximized: () => false,
          onMaximizeChange: (fn) => {
            listener = fn;
            return () => {};
          },
        }),
      });
      expect(screen.getByRole("button", { name: "Maximize" })).toBeDefined();

      // `act`, because the listener sets state from outside React's own event
      // handling — a Tauri window event arrives the same way.
      act(() => listener?.(true));
      expect(screen.getByRole("button", { name: "Restore" })).toBeDefined();
      expect(screen.queryByRole("button", { name: "Maximize" })).toBeNull();
      expect(hostWindow).toBeDefined();
    });

    it("reads an async maximized state on mount", async () => {
      renderShell({ window: makeWindow({ isMaximized: () => Promise.resolve(true) }) });
      expect(await screen.findByRole("button", { name: "Restore" })).toBeDefined();
    });

    it("does not set state after the shell is gone", async () => {
      let resolve: ((value: boolean) => void) | undefined;
      const pending = new Promise<boolean>((r) => {
        resolve = r;
      });
      const { unmount } = renderShell({ window: makeWindow({ isMaximized: () => pending }) });
      unmount();
      // The update must be dropped, not warned about: a window replaced while its
      // state was in flight is normal, not an error.
      resolve?.(true);
      await pending;
      expect(screen.queryByRole("banner")).toBeNull();
    });

    it("unsubscribes when the window changes or the shell unmounts", () => {
      const unsubscribe = vi.fn();
      const { unmount } = renderShell({
        window: makeWindow({ onMaximizeChange: () => unsubscribe }),
      });
      unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("the drag region", () => {
    it("marks the band draggable", () => {
      renderShell();
      // React renders a valueless `data-` attribute as `"true"`, not `""`.
      expect(screen.getByRole("banner").getAttribute("data-tauri-drag-region")).toBe("true");
    });

    it("takes every control out of the drag region, or Close drags instead of closing", () => {
      renderShell();
      // The failure mode is silent and expensive: a press inside a drag region
      // moves the window, so the button never fires and the user drags instead.
      for (const name of ["Minimize", "Maximize", "Close window"]) {
        expect(screen.getByRole("button", { name }).getAttribute("data-tauri-drag-region")).toBe(
          "false",
        );
      }
    });

    it("takes the actions group out of the drag region too", () => {
      renderShell({ actions: <button type="button">Deploy</button> });
      expect(screen.getByRole("button", { name: "Deploy" }).closest("[data-tauri-drag-region]"))
        .toHaveProperty("dataset.tauriDragRegion", "false");
    });

    it("maximizes on a double click, because that is what a title bar does", async () => {
      const { hostWindow } = renderShell();
      await userEvent.dblClick(screen.getByRole("banner"));
      expect(hostWindow.toggleMaximize).toHaveBeenCalledTimes(1);
    });

    it("does not start a drag when the press began on a control", async () => {
      const startDragging = vi.fn();
      const { hostWindow } = renderShell({ window: makeWindow({ startDragging }) });
      await userEvent.click(screen.getByRole("button", { name: "Minimize" }));
      expect(startDragging).not.toHaveBeenCalled();
      expect(hostWindow.minimize).toHaveBeenCalledTimes(1);
    });

    it("starts a drag when the press began on the band itself", async () => {
      const startDragging = vi.fn();
      renderShell({ window: makeWindow({ startDragging }) });
      await userEvent.pointer([
        { keys: "[MouseLeft>]", target: screen.getByRole("banner") },
        { keys: "[/MouseLeft]" },
      ]);
      expect(startDragging).toHaveBeenCalledTimes(1);
    });
  });

  describe("the shell itself", () => {
    it("owns the window height and scrolls inside the page, because a window has no document", () => {
      const { container } = renderShell();
      expect(container.querySelector(".h-dvh")).not.toBeNull();
      expect(screen.getByRole("main").className).toContain("overflow-y-auto");
    });

    it("reuses one navigation array rather than a second copy of the nav", async () => {
      const onNavigate = vi.fn();
      renderShell({ onNavigate });
      // `AdminShell` renders the same `Sidebar` inside a Drawer below 1024px. A
      // window has no narrow state to serve, so there is exactly one.
      expect(screen.getAllByRole("link", { name: "Servers" })).toHaveLength(1);
    });

    it("keeps the skip link, so the nav is not the first tab stop in a window", () => {
      renderShell();
      expect(screen.getByRole("link", { name: /skip/i })).toBeDefined();
    });

    it("marks the current nav item", () => {
      renderShell({ activeId: "servers" });
      expect(screen.getByRole("link", { name: "Servers" }).getAttribute("aria-current")).toBe(
        "page",
      );
    });
  });
});