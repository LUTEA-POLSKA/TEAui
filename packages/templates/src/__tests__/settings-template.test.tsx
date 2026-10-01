import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { SettingsTemplate, type SettingsSection } from "../settings-template";

const SECTIONS: SettingsSection[] = [
  { id: "profile", label: "Profile", children: <p>The profile fields</p> },
  { id: "notifications", label: "Notifications", children: <p>The notification fields</p> },
];

function renderTemplate(overrides: Partial<Parameters<typeof SettingsTemplate>[0]> = {}) {
  const props = {
    title: "Settings",
    sections: SECTIONS,
    activeSection: "profile",
    onSectionChange: () => {},
    saveState: "idle" as const,
    ...overrides,
  };
  return { props, ...render(<SettingsTemplate {...props} />) };
}

describe("SettingsTemplate", () => {
  it("shows the header, the rail and the active section's fields", () => {
    renderTemplate();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeDefined();
    expect(screen.getByText("The profile fields")).toBeDefined();
  });

  it("shows only the active section, so no other section's fields are reachable by accident", () => {
    renderTemplate();
    expect(screen.queryByText("The notification fields")).toBeNull();
  });

  it("reports a section change instead of owning the selection", async () => {
    // The template renders; the router owns which section is current.
    const onSectionChange = vi.fn();
    renderTemplate({ onSectionChange });
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(onSectionChange).toHaveBeenCalledWith("notifications");
  });

  it("names the section that is now shown, because replacing content in place is silent", async () => {
    const onSectionChange = vi.fn();
    const { rerender } = renderTemplate({ onSectionChange });
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));

    rerender(
      <SettingsTemplate
        title="Settings"
        sections={SECTIONS}
        activeSection="notifications"
        onSectionChange={onSectionChange}
        saveState="idle"
      />,
    );
    const statuses = screen.getAllByRole("status");
    // Two live regions is the correct shape here: the section that is now shown
    // and the state of the save are different facts. `SaveBar` owns the second.
    const announcement = statuses.find((node) => node.textContent === "Notifications");
    expect(announcement).toBeDefined();
    expect(announcement!.getAttribute("aria-live")).toBe("polite");
    // `sr-only`, not `hidden` — a display-none live region is never delivered.
    expect(announcement!.className).toContain("sr-only");
  });

  it("falls back to the first section when the active id matches none", () => {
    renderTemplate({ activeSection: "does-not-exist" });
    expect(screen.getByText("The profile fields")).toBeDefined();
  });

  it("says so instead of rendering an empty screen when there are no sections", () => {
    renderTemplate({ sections: [] });
    // An empty settings page is the harder failure to diagnose from the outside,
    // so the reason is in the DOM rather than in a console.
    expect(screen.getByRole("note").textContent).toContain("no sections");
  });

  it("forwards the save state to the bar", () => {
    renderTemplate({ saveState: "dirty", onSave: () => {}, onDiscard: () => {} });
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("passes the failure cause to the bar rather than swallowing it", () => {
    renderTemplate({ saveState: "error", error: "Billing service unreachable" });
    const bar = screen
      .getAllByRole("status")
      .find((node) => node.textContent === "Billing service unreachable");
    expect(bar).toBeDefined();
  });

  it("writes no design token of its own, because the regions own those", async () => {
    // Asserted on the *source*, not the rendered tree. The rendered tree
    // necessarily contains `bg-surface` and `text-fg` — they arrive from `Panel`,
    // `PageHeader` and `SaveBar`, which is the layer boundary working. Checking
    // innerHTML would either fail on the children's correct styling or have to
    // filter it out, and a filter is where the real check goes to die.
    // `process.cwd()` rather than `import.meta.url`: these tests run in the jsdom
    // environment, where `import.meta.url` is an http URL and `readFile` rejects
    // it with "The URL must be of scheme file". vitest runs from the repository
    // root, so the path is built from there.
    const source = await readFile(
      resolve(process.cwd(), "packages/templates/src/settings-template.tsx"),
      "utf8",
    );
    const tokens = source.match(
      /(?:^|[\s"'`])(?:bg|text|border|fill|stroke|ring)-(?:fg|primary|surface|line|destructive|positive|info|caution|neutral|canvas|accent|muted|subtle)\b/gm,
    );
    expect(tokens).toBeNull();

    // What it *is* allowed to write: the two structural relations — vertical
    // stack, and rail beside panel.
    expect(source).toContain("flex flex-col gap-6");
    expect(source).toContain("flex flex-wrap items-start gap-6");
  });

  it("gives the panel the active section's name as its heading", () => {
    renderTemplate({ activeSection: "notifications" });
    expect(screen.getByRole("heading", { level: 2, name: "Notifications" })).toBeDefined();
  });
});