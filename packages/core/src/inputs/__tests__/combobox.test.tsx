import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox, type ComboboxOption, type ComboboxProps } from "../combobox";

const OPTIONS: ComboboxOption[] = [
  { value: "srv-01", label: "srv-01", description: "12 GiB RAM" },
  { value: "srv-02", label: "srv-02" },
  { value: "db-01", label: "db-01" },
];

function renderCombobox({
  label = "Server auswählen",
  options = OPTIONS,
  ...rest
}: Partial<ComboboxProps> = {}) {
  // `label` and `options` are destructured out rather than written after the
  // spread. Writing them after the spread satisfies the compiler but silently
  // overrides whatever the test passed — which is how two filter tests ended
  // up asserting against the default option list instead of their own, and
  // failing for a reason that had nothing to do with the filter.
  return render(<Combobox {...(rest as ComboboxProps)} label={label} options={options} />);
}

/**
 * The public promise of the prop union: with `multiple`, `value` is an array and
 * `onValueChange` reports an array; without it, both are a single string. This
 * is a compile-time assertion. If the split were reverted to `value?: string`,
 * the three `@ts-expect-error` comments would stop being errors — and an
 * unused `@ts-expect-error` is itself a compile error, so the file would fail.
 */
function typeContractOnly(): React.ReactElement[] {
  return [
    <Combobox key="single" label="x" options={[]} value="a" onValueChange={(v: string) => void v} />,
    <Combobox
      key="multi"
      multiple
      label="x"
      options={[]}
      value={["a", "b"]}
      onValueChange={(v: string[]) => void v}
    />,
    // @ts-expect-error a single-select group rejects an array
    <Combobox key="e1" label="x" options={[]} value={["a"]} />,
    // @ts-expect-error a single-select callback is not handed an array
    <Combobox key="e2" label="x" options={[]} onValueChange={(v: string[]) => void v} />,
    // @ts-expect-error a multi-select group rejects a bare string
    <Combobox key="e3" multiple label="x" options={[]} value="a" />,
  ];
}

/**
 * The Combobox arrived here with no tests at all, in a package whose whole
 * premise is that behaviour is asserted rather than assumed. These cover the
 * three things that were wrong, because all three were invisible from the
 * outside: the role sat on the wrong element, the multi-select callback dropped
 * values, and the default filter was hardcoded to German.
 */
describe("Combobox", () => {
  it("puts the combobox role on the input, because that is the element that takes focus", () => {
    renderCombobox();

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-label", "Server auswählen");
    // The old structure was a div[role=combobox] wrapping input[role=searchbox]:
    // assistive tech announced the focusable element as a search box and the
    // combobox as an inert container that could not be reached by Tab.
    expect(input.tagName).toBe("INPUT");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(input.closest('[role="combobox"]')).toBe(input);
  });

  it("keeps the combobox state on the input and points it at the listbox", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-haspopup", "listbox");

    const listboxId = input.getAttribute("aria-controls");
    expect(listboxId).toBeTruthy();
    // `aria-owns` was alongside `aria-controls` on the wrapper. It is an ARIA
    // 1.1 relic for a case `aria-controls` covers, and two attributes claiming
    // the same relationship is how they drift apart.
    expect(input).not.toHaveAttribute("aria-owns");

    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(listboxId!)).toHaveAttribute("role", "listbox");
  });

  it("reports the whole selection in multiple mode, not the value just toggled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ multiple: true, onValueChange });

    const input = screen.getByRole("combobox");
    await user.click(input);

    const listbox = document.getElementById(input.getAttribute("aria-controls")!)!;
    await user.click(within(listbox).getByRole("option", { name: /srv-01/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(["srv-01"]);

    await user.click(within(listbox).getByRole("option", { name: /db-01/ }));
    // The bug: the callback received only "db-01", so a consumer could not
    // reconstruct the selection. It never heard about "srv-01", and on the next
    // removal it would be handed a value that was no longer selected at all.
    expect(onValueChange).toHaveBeenLastCalledWith(["srv-01", "db-01"]);

    await user.click(within(listbox).getByRole("option", { name: /srv-01/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(["db-01"]);
  });

  it("accepts an array as the controlled value in multiple mode", () => {
    renderCombobox({ multiple: true, value: ["srv-01", "db-01"] });

    const input = screen.getByRole("combobox");
    // The selection is shown as the field's placeholder, which is how this
    // control presents a chosen value: the input itself holds the query.
    expect(input).toHaveAttribute("placeholder", "srv-01, db-01");
  });

  it("reports one string in single mode, so the two modes cannot be confused", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ onValueChange });

    const input = screen.getByRole("combobox");
    await user.click(input);
    const listbox = document.getElementById(input.getAttribute("aria-controls")!)!;
    await user.click(within(listbox).getByRole("option", { name: /srv-02/ }));

    expect(onValueChange).toHaveBeenCalledWith("srv-02");
    // Not an array, and not the query.
    expect(onValueChange.mock.calls[0]![0]).toBe("srv-02");
  });

  it("does not filter with German case rules", async () => {
    const user = userEvent.setup();
    renderCombobox({
      options: [{ value: "ist", label: "İstanbul" }],
      emptyMessage: "Keine Treffer",
    });

    const input = screen.getByRole("combobox");
    await user.type(input, "istanbul");

    // Under the old `toLocaleLowerCase("de")` on both sides, "İstanbul" folds to
    // "i̇stanbul" — an i with a combining dot above — which does not contain
    // "istanbul", so the one option matching the query was reported as no match.
    // A library that hardcodes one user's locale fails that user first and
    // everyone else later.
    expect(screen.getByRole("option", { name: /İstanbul/ })).toBeInTheDocument();
    expect(screen.queryByText("Keine Treffer")).toBeNull();
  });

  it("matches across diacritics, which lowercasing alone never did", async () => {
    const user = userEvent.setup();
    renderCombobox({ options: [{ value: "c", label: "Café Crème" }] });

    await user.type(screen.getByRole("combobox"), "cafe");

    expect(screen.getByRole("option", { name: /Café Crème/ })).toBeInTheDocument();
  });

  it("moves the active option with the arrow keys and commits with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ onValueChange });

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");

    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("option"));
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("srv-01");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps single and multiple apart in the type, not only at runtime", () => {
    // Nothing is asserted at runtime: the assertions are in the compiler. The
    // five elements below only have to build, and the three `@ts-expect-error`
    // markers only have to keep being errors.
    const built = typeContractOnly();
    expect(built).toHaveLength(5);
  });

  it("names the clear button, in the consumer's language rather than the library's", async () => {
    const user = userEvent.setup();
    renderCombobox({ clearLabel: "Auswahl verwerfen" });

    const input = screen.getByRole("combobox");
    await user.type(input, "srv");

    // It was `aria-label="Suche leeren"` — a German string compiled into the
    // package, so every product in every language announced it in German.
    expect(screen.getByRole("button", { name: "Auswahl verwerfen" })).toBeInTheDocument();
  });
});
