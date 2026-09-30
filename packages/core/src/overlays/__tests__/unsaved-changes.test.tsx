import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useUnsavedChanges } from "../unsaved-changes";

function Harness({
  dirty,
  save,
  onNavigate,
}: {
  dirty: boolean;
  save?: (() => Promise<void> | void) | undefined;
  onNavigate?: (id: string) => void;
}): React.ReactElement {
  const { confirmation, guard, dirty: isDirty } = useUnsavedChanges({ dirty, save });
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div>
      <button
        onClick={async () => {
          if (!(await guard())) return;
          (onNavigate ?? setLast)("server-1");
        }}
      >
        Zu Server 1
      </button>
      <span data-testid="state">{isDirty ? "dirty" : "clean"}</span>
      {last ? <span data-testid="last">{last}</span> : null}
      {confirmation}
    </div>
  );
}

describe("useUnsavedChanges", () => {
  it("does not ask when there is nothing to lose", async () => {
    const onNavigate = vi.fn();
    render(<Harness dirty={false} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("server-1"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("blocks the navigation and asks when there is", async () => {
    const onNavigate = vi.fn();
    render(<Harness dirty onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Unsaved changes");
    // The data-loss bug this exists to prevent: the route changed anyway.
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("lets the user stay and keep their work", async () => {
    render(<Harness dirty onNavigate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));

    await screen.findByRole("alertdialog");
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByTestId("state")).toHaveTextContent("dirty");
  });

  it("leads with saving, not with discarding", async () => {
    const save = vi.fn();
    render(<Harness dirty save={save} onNavigate={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));
    const dialog = await screen.findByRole("alertdialog");

    // The order in the DOM is destructive-first because the footer is
    // `flex-col-reverse`; the *visual* order on a desktop is save, stay, discard.
    const buttons = Array.from(dialog.querySelectorAll("button")).map((b) => b.textContent?.trim());
    expect(buttons).toEqual(["Discard and leave", "Keep editing", "Save"]);

    // The primary action must be the primary variant, not a secondary one.
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton.className).toMatch(/bg-primary/);
    const discardButton = screen.getByRole("button", { name: "Discard and leave" });
    expect(discardButton.className).toMatch(/bg-destructive/);
  });

  it("uses a caution tone, because a red octagon on every tab switch trains dismissal", async () => {
    render(<Harness dirty save={vi.fn()} onNavigate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));

    const dialog = await screen.findByRole("alertdialog");
    // `getAttribute`, not `.className`: on an SVG element in jsdom `className` is
    // an `SVGAnimatedString`, not a string, and the assertion would pass or fail
    // for reasons that have nothing to do with the tone.
    const icon = dialog.querySelector("span[aria-hidden='true'] > svg");
    expect(icon?.getAttribute("class")).toContain("text-caution");
    expect(icon?.getAttribute("class")).not.toContain("text-critical");
  });

  it("clears the trap after a save", async () => {
    const save = vi.fn();
    const onNavigate = vi.fn();
    render(<Harness dirty save={save} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));
    await screen.findByRole("alertdialog");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(save).toHaveBeenCalled();
  });

  it("does not clean itself on discard, because discarding is not saving", async () => {
    render(<Harness dirty save={vi.fn()} onNavigate={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Zu Server 1" }));
    await screen.findByRole("alertdialog");
    await userEvent.click(screen.getByRole("button", { name: "Discard and leave" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    // The form is still dirty, so the next navigation asks again rather than
    // pretending the user is clean.
    expect(screen.getByTestId("state")).toHaveTextContent("dirty");
  });
});
