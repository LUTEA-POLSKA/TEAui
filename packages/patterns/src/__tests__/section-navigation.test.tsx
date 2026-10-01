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

  const DISABLED_ITEMS = [
    ...ITEMS,
    {
      id: "sso",
      label: "Single sign-on",
      disabled: true,
      disabledReason: "Requires a plan with SAML support",
    },
  ];

  it("keeps a disabled section visible instead of hiding it", () => {
    render(
      <SectionNavigation label="Sections" items={DISABLED_ITEMS} active="profile" onSelect={() => {}} />,
    );
    // Hidden means "the page is broken"; disabled means "not yet", and it is
    // findable and its reason is available.
    expect(screen.getByRole("button", { name: /Single sign-on/ })).toBeDefined();
  });

  it("does not report a click from a disabled section", async () => {
    const onSelect = vi.fn();
    render(
      <SectionNavigation label="Sections" items={DISABLED_ITEMS} active="profile" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Single sign-on/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("leaves a disabled section focusable, because an unreachable one announces nothing", async () => {
    render(
      <SectionNavigation label="Sections" items={DISABLED_ITEMS} active="profile" onSelect={() => {}} />,
    );
    // The native `disabled` attribute removes the button from the tab order, so
    // a keyboard user never reaches the item and never hears why it is
    // unavailable. `aria-disabled` keeps it reachable without making it
    // activatable — the click guard is asserted separately.
    const sso = screen.getByRole("button", { name: /Single sign-on/ });
    expect(sso).not.toBeDisabled();
    expect(sso.getAttribute("aria-disabled")).toBe("true");

    sso.focus();
    expect(sso).toHaveFocus();
    await userEvent.tab();
    expect(sso).not.toHaveFocus();
  });

  it("exposes the reason as the button's description, not only as a tooltip", () => {
    render(
      <SectionNavigation label="Sections" items={DISABLED_ITEMS} active="profile" onSelect={() => {}} />,
    );
    const sso = screen.getByRole("button", { name: /Single sign-on/ });

    // `aria-describedby` pointing at a real element is the robust route. A
    // `title` on its own is a tooltip: unavailable to a keyboard user and
    // unreachable by touch, so it is rendered in addition, never instead.
    const describedBy = sso.getAttribute("aria-describedby");
    expect(describedBy).not.toBeNull();
    const reason = document.getElementById(describedBy!);
    expect(reason?.textContent).toBe("Requires a plan with SAML support");
    // `sr-only`, not `hidden`: a display-none description is not in the
    // accessibility tree, so the reference resolves to nothing that is read.
    expect(reason?.className).toContain("sr-only");
    expect(sso).toHaveAccessibleDescription("Requires a plan with SAML support");
  });

  it("marks a disabled section by more than contrast alone", () => {
    render(
      <SectionNavigation label="Sections" items={DISABLED_ITEMS} active="profile" onSelect={() => {}} />,
    );
    // `opacity-50` distinguishes the row by contrast alone, which is what WCAG
    // 2.2 1.4.1 forbids. A visible word and a not-allowed cursor carry the state
    // on channels that do not depend on perceiving the difference.
    const sso = screen.getByRole("button", { name: /Single sign-on/ });
    expect(sso.className).toContain("cursor-not-allowed");
    expect(screen.getByText("Unavailable")).toBeDefined();
  });

  it("describes nothing when a disabled section has no reason to give", () => {
    const items = [...ITEMS, { id: "sso", label: "Single sign-on", disabled: true }];
    render(<SectionNavigation label="Sections" items={items} active="profile" onSelect={() => {}} />);
    // An `aria-describedby` pointing at a missing id is worse than no attribute:
    // it is a reference the consumer cannot resolve.
    expect(screen.getByRole("button", { name: /Single sign-on/ }).getAttribute("aria-describedby")).toBeNull();
  });

  it("shows a badge beside the label", () => {
    const items = [{ id: "profile", label: "Profile", badge: <span>2</span> }];
    render(<SectionNavigation label="Sections" items={items} active="profile" onSelect={() => {}} />);
    expect(screen.getByText("2")).toBeDefined();
  });
});