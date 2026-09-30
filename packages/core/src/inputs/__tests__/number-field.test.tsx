import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Field, FieldDescription, FieldError, FieldLabel } from "../field";
import { NumberField } from "../number-field";

/**
 * The audit's verdict on the source implementation was "the best form control in
 * we found", used **once** in thirteen pages. These tests are about the three
 * things it had that a bare `NumberInput` does not: the unit, the Field wiring,
 * and the fact that a number without a scale is not an answer.
 */
describe("NumberField", () => {
  it("announces the unit, because 512 without a scale is not a number", () => {
    render(
      <Field>
        <FieldLabel>Speicherplatz</FieldLabel>
        <NumberField unit="GB" defaultValue={512} />
      </Field>,
    );

    const input = screen.getByRole("spinbutton", { name: "Speicherplatz" });
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);

    // The visible unit is the announced unit — one element, not a copy.
    const unit = document.getElementById(ids[0]!);
    expect(unit).toHaveTextContent("GB");
  });

  it("wires itself to the Field, unlike the twelve raw controls the audit counted", () => {
    render(
      <Field required>
        <FieldLabel>Anzahl</FieldLabel>
        <NumberField min={1} max={64} defaultValue={4} />
      </Field>,
    );

    const input = screen.getByRole("spinbutton", { name: /Anzahl/ });
    // Zero `htmlFor` in the whole source frontend: the id is what makes the
    // visible label a real label.
    expect(input).toHaveAttribute("id");
    expect(document.querySelector("label")).toHaveAttribute("for", input.getAttribute("id"));
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("puts the field's description and its error on the control", () => {
    render(
      <Field invalid>
        <FieldLabel>Anzahl</FieldLabel>
        <NumberField />
        <FieldDescription>Zwischen 1 und 64.</FieldDescription>
        <FieldError>Muss mindestens 1 sein.</FieldError>
      </Field>,
    );

    const input = screen.getByRole("spinbutton", { name: /Anzahl/ });
    expect(input).toHaveAttribute("aria-invalid", "true");
    const ids = (input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    const text = ids.map((id) => document.getElementById(id)?.textContent).join(" ");
    expect(text).toContain("Zwischen 1 und 64.");
    expect(text).toContain("Muss mindestens 1 sein.");
  });

  it("reverts a half-typed value on blur instead of reporting NaN", async () => {
    const onValueChange = vi.fn();
    render(
      <Field>
        <FieldLabel>Anzahl</FieldLabel>
        <NumberField defaultValue={4} onValueChange={onValueChange} />
      </Field>,
    );

    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    // The intermediate `-` of a negative number is not a number. The model must
    // never see it.
    await userEvent.type(input, "-");
    await userEvent.tab();

    expect(onValueChange).not.toHaveBeenCalledWith(Number.NaN);
    expect(input).toHaveValue(4);
  });

  it("clamps into the declared range on blur, not on every keystroke", async () => {
    const onValueChange = vi.fn();
    render(
      <Field>
        <FieldLabel>Anzahl</FieldLabel>
        <NumberField min={1} max={10} defaultValue={4} onValueChange={onValueChange} />
      </Field>,
    );

    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "999");
    // Still typing: the box holds what was typed. Clamping here would make it
    // impossible to type a value *below* the current one.
    expect(input).toHaveValue(999);

    await userEvent.tab();
    expect(input).toHaveValue(10);
  });

  it("degrades to a plain number input outside a Field", () => {
    render(<NumberField defaultValue={7} />);
    // Same contract as `Input` and `Textarea`: no `Field`, no wiring, no crash.
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("is not a group landmark, because an unnamed one says nothing", () => {
    render(
      <Field>
        <FieldLabel>Anzahl</FieldLabel>
        <NumberField unit="GB" />
      </Field>,
    );
    // The name comes from the `<label for>`; a second landmark would announce
    // the same thing twice.
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
