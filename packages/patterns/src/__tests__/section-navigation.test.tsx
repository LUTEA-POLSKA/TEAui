import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SectionNavigation } from "../navigation/section-navigation";

const ITEMS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

describe("SectionNavigation", () => {
  it("is a named landmark, because two rails on one page are otherwise identical", () => {
    render(<SectionNavigation label="Settings sections" items={ITEMS} active="profile" onSelect={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeDefined();
  });

  it("marks the current section with aria-current, not with colour alone", () => {
    render(<SectionNavigation label="Sections" items={ITEMS} active="notifications" onSelect={() => {}} />);
    const current = screen.getByRole("button", { name: "Notifications" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Profile" }).getAttribute("aria-current")).toBeNull();
  });

  it("is a list of sections and not a tablist", () => {
    // Tabs promise `aria-controls` pointing at a real panel and arrow-key
    // roving. This rail scrolls a page instead, so claiming tab semantics
    // announces a capability the component does not have.
    render(<SectionNavigation label="Sections" items={ITEMS} active="profile" onSelect={() => {}} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("reports the id that was chosen", async () => {
    const onSelect = vi.fn();
    render(<SectionNavigation label="Sections" items={ITEMS} active="profile" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Billing" }));
    expect(onSelect).toHaveBeenCalledWith("billing");
  });

  it("keeps a disabled section visible instead of hiding it", () => {
    const items = [...ITEMS, { id: "sso", label: "Single sign-on", disabled: true }];
    render(<SectionNavigation label="Sections" items={items} active="profile" onSelect={() => {}} />);
    // Hidden means "the page is broken"; disabled means "not yet", and it is
    // findable and its reason is available.
    expect(screen.getByRole("button", { name: "Single sign-on" })).toBeDefined();
  });

  it("does not report a click from a disabled section", async () => {
    const onSelect = vi.fn();
    const items = [...ITEMS, { id: "sso", label: "Single sign-on", disabled: true }];
    render(<SectionNavigation label="Sections" items={items} active="profile" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Single sign-on" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a badge beside the label", () => {
    const items = [{ id: "profile", label: "Profile", badge: <span>2</span> }];
    render(<SectionNavigation label="Sections" items={items} active="profile" onSelect={() => {}} />);
    expect(screen.getByText("2")).toBeDefined();
  });
});