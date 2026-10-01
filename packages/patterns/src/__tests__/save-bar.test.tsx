import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SaveBar } from "../forms/save-bar";

describe("SaveBar", () => {
  it("offers nothing to save when nothing changed", () => {
    render(<SaveBar state="idle" onSave={() => {}} onDiscard={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers Save and Discard once there are changes", () => {
    render(<SaveBar state="dirty" onSave={() => {}} onDiscard={() => {}} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDefined();
  });

  it("disables Discard while saving, because the request would otherwise win", async () => {
    const onDiscard = vi.fn();
    render(<SaveBar state="saving" onSave={() => {}} onDiscard={onDiscard} />);

    // The audit's data-loss case: Discard stays clickable during an in-flight
    // request, the request resolves, and it writes back what was discarded.
    const discard = screen.getByRole("button", { name: "Discard" }) as HTMLButtonElement;
    expect(discard.disabled).toBe(true);
    await userEvent.click(discard);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("confirms a save and then stops offering to save it again", async () => {
    const onSave = vi.fn();
    const { rerender } = render(<SaveBar state="dirty" onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    rerender(<SaveBar state="saved" onSave={onSave} />);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("announces every state through one live region that stays mounted", () => {
    // A region created together with its message is regularly missed: the
    // assistive technology has to already be watching the node.
    const { rerender } = render(<SaveBar state="dirty" />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");

    for (const state of ["saving", "saved", "error"] as const) {
      rerender(<SaveBar state={state} error="The server rejected the value" />);
      expect(screen.getByRole("status")).toBe(region);
    }
  });

  it("names the cause of a failure rather than saying \"Error\"", () => {
    render(<SaveBar state="error" error="Port 443 is blocked by the firewall" />);
    expect(screen.getByRole("status").textContent).toBe("Port 443 is blocked by the firewall");
  });

  it("keeps Save available after a failure, because retrying is the next step", () => {
    render(<SaveBar state="error" error="Rejected" onSave={() => {}} />);
    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
  });

  it("uses the same words as the leave guard, so the page speaks once", () => {
    // `UNSAVED_CHANGES.title` is what `useUnsavedChanges` puts in its dialog. The
    // bar inventing a second phrasing for the same fact is the audit's finding.
    render(<SaveBar state="dirty" />);
    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
  });

  it("exposes the state on the element, so a product can style it", () => {
    const { container } = render(<SaveBar state="saving" />);
    expect(container.querySelector("[data-state]")?.getAttribute("data-state")).toBe("saving");
  });
});