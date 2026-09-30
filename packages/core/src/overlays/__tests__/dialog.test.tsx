import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

/**
 * The plain `Dialog` shipped with no tests and no usage anywhere in the
 * repository — exported, never exercised, never rendered. Its title handling
 * searched only the direct children for a `DialogTitle`, so the composition the
 * component's own `DialogHeader` exists to encourage put the title one level
 * too deep, and a second, visually hidden title was rendered next to it.
 */
describe("Dialog", () => {
  function renderDialog(content: React.ReactNode) {
    return render(
      <Dialog>
        <DialogTrigger>Öffnen</DialogTrigger>
        <DialogContent>{content}</DialogContent>
      </Dialog>,
    );
  }

  it("finds the title inside a header, which is the composition it ships for", async () => {
    const user = userEvent.setup();
    renderDialog(
      <DialogHeader>
        <DialogTitle>Server löschen</DialogTitle>
      </DialogHeader>,
    );

    await user.click(screen.getByRole("button", { name: "Öffnen" }));

    // One heading, not two. The direct-children check missed the grandchild,
    // so the sr-only fallback rendered alongside the real title.
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Server löschen" })).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("names the dialog by the title it found", async () => {
    const user = userEvent.setup();
    renderDialog(
      <div>
        <div>
          <DialogTitle>Verbindung trennen</DialogTitle>
        </div>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Öffnen" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Verbindung trennen");
  });

  it("finds a title behind a fragment", async () => {
    const user = userEvent.setup();
    renderDialog(
      <>
        <DialogBody>Inhalt</DialogBody>
        <>
          <DialogTitle>Fragment-Titel</DialogTitle>
        </>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Öffnen" }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Fragment-Titel");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("falls back to a hidden title rather than leaving the dialog unnamed", async () => {
    const user = userEvent.setup();
    renderDialog(<DialogBody>Kein Titel</DialogBody>);

    await user.click(screen.getByRole("button", { name: "Öffnen" }));

    const dialog = await screen.findByRole("dialog");
    // Unnamed is the failure this guards: a dialog with no accessible name is
    // announced as just "dialog", which tells a screen-reader user nothing.
    expect(dialog).toHaveAccessibleName();
    expect(dialog.getAttribute("aria-label") ?? dialog.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("uses the caller's fallbackTitle when no DialogTitle is present", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Öffnen</DialogTrigger>
        <DialogContent fallbackTitle="Bestätigung erforderlich">
          <DialogBody>Kein Titel</DialogBody>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Öffnen" }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Bestätigung erforderlich");
  });

  it("names the close button", async () => {
    const user = userEvent.setup();
    renderDialog(<DialogTitle>Titel</DialogTitle>);

    await user.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("dialog");

    // An unlabelled icon-only button is a WCAG failure, so this is asserted by
    // role+name rather than by class name.
    expect(screen.getByRole("button", { name: /.+/ })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Öffnen</DialogTrigger>
        <DialogContent>
          <DialogTitle>Titel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Öffnen" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
