import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button, Field, FieldDescription, FieldError, FieldLabel, Input, Label } from "@tea-ui/core";

/**
 * The contract's minimum bar, tested on the reference component.
 *
 * This file is deliberately small and deliberately about *behaviour* rather than
 * class strings. A snapshot of a class list breaks on every legitimate change
 * and catches nothing; a failing `toHaveAccessibleName` catches the exact defect
 * class the audit found everywhere — controls that cannot be named.
 */
describe("Button", () => {
  it("exposes an accessible name from its text content", () => {
    render(<Button>Speichern</Button>);
    expect(screen.getByRole("button", { name: "Speichern" })).toBeInTheDocument();
  });

  it("is a real button that does not submit a form by accident", () => {
    render(<Button>Speichern</Button>);
    // The native default for a button inside a form is `submit`. A TEA UI
    // button must opt in to that, never inherit it.
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("sets aria-busy and blocks repeat activation while loading", async () => {
    const user = userEvent.setup();
    const clicks: number[] = [];
    render(
      <Button loading onClick={() => clicks.push(1)}>
        Speichern
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    await user.click(button);
    expect(clicks).toHaveLength(0);
  });

  it("keeps its width while loading, so the label does not shift", () => {
    const { rerender } = render(<Button>Speichern</Button>);
    expect(screen.getByRole("button")).not.toHaveTextContent("Wird geladen");
    rerender(<Button loading>Speichern</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Speichern");
  });

  it("exposes its state as data attributes, not only as styling", () => {
    render(<Button disabled>Abbrechen</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-disabled", "true");
  });

  it("is operable by keyboard", async () => {
    const user = userEvent.setup();
    const clicks: number[] = [];
    render(<Button onClick={() => clicks.push(1)}>Speichern</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(clicks).toHaveLength(2);
  });
});

/**
 * The Field system exists because four of the five field implementations in the
 * source projects used a `<label>` that was never associated with its control.
 * These tests fail if that can happen again.
 */
describe("Field", () => {
  it("associates label, description and error with the control", () => {
    render(
      <Field invalid required id="email">
        <FieldLabel>E-Mail</FieldLabel>
        <Input type="email" />
        <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
        <FieldError>Bitte gib eine gültige Adresse an.</FieldError>
      </Field>,
    );

    const input = screen.getByRole("textbox", { name: "E-Mail" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    // Assert on the *accessible* name, not on the label's `textContent`. The
    // required marker is `aria-hidden`, so it must not leak into the name —
    // otherwise the control announces as "E-Mail Pflichtfeld".
    expect(input).toHaveAccessibleName("E-Mail");
    // `aria-describedby` must carry BOTH ids, not only the first one found.
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain("-description");
    expect(describedBy).toContain("-error");
  });

  it("announces a field error, because a colour change is not an announcement", () => {
    render(
      <Field invalid id="name">
        <FieldLabel>Name</FieldLabel>
        <Input />
        <FieldError>Name fehlt.</FieldError>
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Name fehlt.");
  });

  it("does not render an error element when there is no error", () => {
    render(
      <Field id="name">
        <FieldLabel>Name</FieldLabel>
        <Input />
        <FieldError />
      </Field>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Label", () => {
  it("names the control it is given via htmlFor", () => {
    render(
      <>
        <Label htmlFor="display-name">Anzeigename</Label>
        <Input id="display-name" />
      </>,
    );
    expect(screen.getByLabelText("Anzeigename")).toBeInTheDocument();
  });
});
