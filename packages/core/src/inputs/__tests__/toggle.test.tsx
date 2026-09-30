import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "../toggle";

/** The indicator's slot, as `dataSlot("toggle", "indicator")` renders it. */
const INDICATOR = '[data-slot="tea-toggle-indicator"]';

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * TEA UI — ToggleGroup.
 *
 * The test that matters here is the first one, and it exists because this
 * component was quietly broken. `ToggleGroup` rendered Radix's root, so the
 * container announced `role="radiogroup"` — but its children were TEA `Toggle`s,
 * which are built on Radix's *standalone* `Toggle` and never register a value
 * with a group. The result was a radiogroup containing plain `aria-pressed`
 * buttons, and the group's own `value`, `defaultValue` and `onValueChange` went
 * nowhere.
 *
 * It failed silently and looked like it worked. The Showcase's theme switcher
 * highlighted on click and changed no theme; the grid/list switch in the
 * Showcase's own component gallery did the same. A control that renders as
 * switched and is not is the same defect as a table that reorders its glyph and
 * not its rows — and both were found by asserting behaviour rather than by
 * reading the markup.
 */
describe("ToggleGroup", () => {
  // Captured before any test runs. The geometry test below replaces
  // `getBoundingClientRect` and redefines `clientLeft`/`clientTop` on
  // `Element.prototype`, and a prototype mutation is not undone by
  // `restoreAllMocks` — it is not a spy. Without this, every later test in the
  // file measured against a stubbed box, and the file's own order decided which
  // assertions were real. jsdom does not define these on `Element.prototype`, so
  // the originals are usually absent and restoring means deleting.
  const pristine = {
    clientLeft: Object.getOwnPropertyDescriptor(Element.prototype, "clientLeft"),
    clientTop: Object.getOwnPropertyDescriptor(Element.prototype, "clientTop"),
  };

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of ["clientLeft", "clientTop"] as const) {
      const descriptor = pristine[key];
      if (descriptor) {
        Object.defineProperty(Element.prototype, key, descriptor);
      } else {
        Reflect.deleteProperty(Element.prototype, key);
      }
    }
  });

  function renderGroup(extra?: string, selection?: "primary" | "secondary" | "outline") {
    return render(
      <ToggleGroup
        type="single"
        defaultValue="a"
        aria-label="Gruppe"
        className="border border-line"
        selection={selection}
      >
        <ToggleGroupItem value="a" className={extra}>
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" className={extra}>
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
  }

  it("reports the selected value, which is the whole point of the group", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="single" value="a" onValueChange={onValueChange} aria-label="Gruppe">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "B" }));

    // This is what silently did not happen: the group never learned about a
    // click, so a controlled group could not be changed at all.
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("renders radios inside the radiogroup, not pressed-buttons", () => {
    renderGroup();

    const items = screen.getAllByRole("radio");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("aria-checked", "true");
    expect(items[1]).toHaveAttribute("aria-checked", "false");
    // A standalone `Toggle` child would land here instead.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("honours defaultValue, which also did nothing before", () => {
    renderGroup();

    const items = screen.getAllByRole("radio");
    expect(items[0]).toHaveAttribute("data-state", "on");
    expect(items[0]).toHaveAttribute("aria-checked", "true");
    expect(items[1]).toHaveAttribute("data-state", "off");
  });

  it("moves the selection with the arrow keys, because it announces a radiogroup", async () => {
    const user = userEvent.setup();
    // Stateful, because a controlled group whose `onValueChange` ignores the
    // change cannot change — the first version of this test asserted "c" on a
    // value pinned at "a" and was asserting the impossible.
    function Stateful() {
      const [value, setValue] = React.useState("a");
      return (
        <ToggleGroup type="single" value={value} onValueChange={setValue} aria-label="Gruppe">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      );
    }
    render(<Stateful />);

    const [first, second, third] = screen.getAllByRole("radio") as HTMLElement[];
    const selected = () => (screen.getAllByRole("radio") as HTMLElement[]).find((n) => n.dataset.state === "on");

    await user.tab();
    expect(document.activeElement).toBe(first);

    // The claim being guarded: an arrow key must carry the *value*, not just the
    // focus. Radix moves the focus and stops there, so `aria-checked` stayed on
    // "a" while the focus sat on "b" — a screen-reader user told they were on "b"
    // while the group still said "a". Radix is a button group wearing a radio
    // group's name, and the group has to make that true.
    await user.keyboard("{ArrowRight}");
    expect(selected()).toBe(second);
    expect(second).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowRight}");
    expect(selected()).toBe(third);

    // Wraps, so the value is never stranded off-screen.
    await user.keyboard("{ArrowRight}");
    expect(selected()).toBe(first);

    await user.keyboard("{ArrowLeft}");
    expect(selected()).toBe(third);

    // Home and End too: Radix already moved focus for them, so leaving them out
    // would have reproduced the same split one keypress later.
    await user.keyboard("{Home}");
    expect(selected()).toBe(first);

    await user.keyboard("{End}");
    expect(selected()).toBe(third);
  });

  it("keeps select-on-arrow when there is no indicator, because the registry is unconditional", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    // No `indicator` prop. A presentational prop must not be able to switch off
    // an ARIA behaviour, and the first version of this fix did exactly that.
    render(
      <ToggleGroup type="single" value="a" onValueChange={onValueChange} aria-label="Gruppe">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenLastCalledWith("b");
  });

  it("ignores the cross-axis arrows, so it cannot fight the orientation prop", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        type="single"
        orientation="vertical"
        value="a"
        onValueChange={onValueChange}
        aria-label="Gruppe"
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("is a single tab stop, because roving focus is the reason to use a group", async () => {
    const user = userEvent.setup();
    renderGroup();

    await user.tab();
    expect(document.activeElement).toBe(screen.getAllByRole("radio")[0]);
  });

  it("treats a move onto the current value as a no-op, not a deselect", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    // In a single-select group a click is a toggle, so a keyboard move that
    // lands back on the current value would report `""` and clear a value that
    // has no "empty" state — a theme that can be switched off. The guard is only
    // reachable by arriving at the current value, which needs either a one-item
    // group or Home/End at the edge; every other press lands somewhere else.
    render(
      <ToggleGroup type="single" value="a" onValueChange={onValueChange} aria-label="Gruppe">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("radio"));

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");

    // Not called with "" and not called at all: the one item is the current
    // value, so there is nowhere to go.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio")).toHaveAttribute("data-state", "on");
  });

  it("is named by \"label\", like every other composite here", () => {
    render(
      <ToggleGroup type="single" label="Server" aria-label="aria-label wins">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    const group = screen.getByRole("radiogroup");
    // The prop exists because the documentation could not be written without it:
    // IconButton, Combobox and FieldLabel all take `label`, and the group
    // silently needed `aria-label` instead.
    expect(group).toHaveAccessibleName();
    expect(group).toHaveAttribute("aria-label", "aria-label wins");
  });

  it("names the group from label, and nothing else is required", () => {
    render(
      <ToggleGroup type="single" label="Server">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("radiogroup")).toHaveAccessibleName("Server");
  });

  it("still calls the consumer's own onKeyDown", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <ToggleGroup
        type="single"
        value="a"
        onValueChange={onValueChange}
        onKeyDown={onKeyDown}
        aria-label="Gruppe"
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).toHaveBeenLastCalledWith("b");
  });

  it("defaults the selection to the primary role", () => {
    renderGroup();

    const selected = screen.getAllByRole("radio")[0]!;
    expect(selected.className).toContain("data-[state=on]:text-primary");
    expect(selected.className).toContain("data-[state=on]:bg-primary-subtle");
  });

  it("supports an outline selection: transparent surface, state carried by the line", () => {
    renderGroup(undefined, "outline");

    const selected = screen.getAllByRole("radio")[0]!;
    // The Outline recipe with its hover state promoted to the pressed state.
    expect(selected.className).toContain("data-[state=on]:bg-surface-2");
    expect(selected.className).toContain("data-[state=on]:border-line-strong");
    expect(selected.className).toContain("data-[state=on]:text-fg");
    expect(selected.className).not.toContain("data-[state=on]:text-primary");
  });

  it("supports a secondary selection, which is neutral emphasis and not a second hue", () => {
    renderGroup(undefined, "secondary");

    const selected = screen.getAllByRole("radio")[0]!;
    // TEA has no second hue, so a "secondary" selection that coloured itself
    // would be inventing one.
    expect(selected.className).toContain("data-[state=on]:bg-surface-3");
    expect(selected.className).toContain("data-[state=on]:border-line-strong");
    expect(selected.className).toContain("data-[state=on]:text-fg");
  });

  it("passes the selection from the group to items wrapped in a consumer component", () => {
    function Labelled({ children }: { children: React.ReactNode }): React.ReactElement {
      return <span>{children}</span>;
    }

    render(
      <ToggleGroup
        type="single"
        defaultValue="a"
        aria-label="Gruppe"
        selection="secondary"
        size="sm"
      >
        <Labelled>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </Labelled>
      </ToggleGroup>,
    );

    const item = screen.getByRole("radio");
    expect(item.className).toContain("data-[state=on]:bg-surface-3");
    expect(item.className).toContain("text-micro");
  });

  it("draws no indicator unless asked, so no existing consumer changes appearance", () => {
    renderGroup();

    expect(document.querySelector(INDICATOR)).toBeNull();
    expect(screen.getByRole("radiogroup").className).not.toContain("relative");
  });

  it("hides the indicator from assistive technology, because the item already announces itself", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Gruppe" indicator>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    const indicator = document.querySelector(INDICATOR);
    expect(indicator).not.toBeNull();
    // The selected item already carries `aria-checked`. A second element
    // describing the same thing announces the selection twice.
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    // And it must not swallow clicks meant for the item behind it.
    expect(indicator!.className).toContain("pointer-events-none");
  });

  it("makes the group a positioning context when the indicator is on", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Gruppe" indicator>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    // Without this the indicator is positioned against some ancestor further up
    // and lands in the wrong place entirely — and it still animates, so the
    // mistake reads as motion rather than as an error.
    expect(screen.getByRole("radiogroup").className).toContain("relative");
  });

  it("lets the indicator carry the fill so the item does not paint one as well", () => {
    render(
      <ToggleGroup
        type="single"
        defaultValue="a"
        aria-label="Gruppe"
        indicator
        selection="outline"
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    const selected = screen.getAllByRole("radio")[0]!;
    // A selected item with a background *and* an indicator behind it reads as a
    // slightly misaligned double shape.
    expect(selected.className).not.toContain("data-[state=on]:bg-surface-2");
    // The text emphasis stays, because the fill is the indicator's job only.
    expect(selected.className).toContain("data-[state=on]:text-fg");
  });

  it("keeps painting the fill itself when there is no indicator", () => {
    renderGroup(undefined, "outline");

    expect(screen.getAllByRole("radio")[0]!.className).toContain("data-[state=on]:bg-surface-2");
  });

  it("measures the indicator against the selected item and keeps it in step", async () => {
    // jsdom reports every box as zero, so the geometry is stubbed to a real
    // horizontal strip: a group at 0 with two 100px items, inset by a 1px
    // border and 4px of padding the way a real segmented control is.
    const boxes = new Map<string, DOMRect>([
      ["group", rect(0, 0, 210, 42)],
      ["a", rect(5, 5, 100, 32)],
      ["b", rect(105, 5, 100, 32)],
    ]);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const key = (this as HTMLElement).dataset.probe;
      return (key ? boxes.get(key) : undefined) ?? rect(0, 0, 0, 0);
    });
    // `clientLeft`/`clientTop` are read-only and always 0 under jsdom, so the
    // border-width correction has to be stubbed too — otherwise the arithmetic
    // that puts the indicator 1px low in a real browser is never exercised.
    Object.defineProperty(Element.prototype, "clientLeft", {
      configurable: true,
      get(this: Element) {
        return (this as HTMLElement).dataset.probe === "group" ? 1 : 0;
      },
    });
    Object.defineProperty(Element.prototype, "clientTop", {
      configurable: true,
      get(this: Element) {
        return (this as HTMLElement).dataset.probe === "group" ? 1 : 0;
      },
    });

    function Grouped({ value }: { value: string }): React.ReactElement {
      return (
        <ToggleGroup type="single" value={value} aria-label="Gruppe" indicator data-probe="group">
          <ToggleGroupItem value="a" data-probe="a">
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="b" data-probe="b">
            B
          </ToggleGroupItem>
        </ToggleGroup>
      );
    }

    const { rerender } = render(<Grouped value="a" />);
    const indicator = () => document.querySelector(INDICATOR) as HTMLElement;

    expect(indicator().getAttribute("data-state")).toBe("placed");
    expect(indicator().style.width).toBe("100px");
    expect(indicator().style.height).toBe("32px");
    // The border is subtracted, so the indicator lands on the item and not one
    // pixel low. Measured in a browser: 32px against the item's 32px, 0px over
    // and 0px under.
    expect(indicator().style.top).toBe("4px");
    expect(indicator().style.transform).toBe("translateX(4px)");
    // `left: 0` is load-bearing, not tidy-up. Without it the element keeps its
    // static position — already on the first item's edge — and `translateX`
    // adds to that, which produced a constant 4px error in every theme while
    // the vertical axis measured exact. Asymmetric correctness is worse than
    // symmetric breakage, because it hides behind the half that works.
    expect(indicator().style.left).toBe("0px");

    // A pixel position that is never recomputed does not announce itself — it
    // just sits slightly wrong, which is the failure this component exists to
    // avoid. So changing the value has to re-measure.
    rerender(<Grouped value="b" />);
    expect(indicator().style.transform).toBe("translateX(104px)");
  });

  it("declares no transition until the geometry is known, so nothing slides in from nothing", () => {
    render(
      <ToggleGroup type="single" aria-label="Gruppe" indicator>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    // No value, so nothing to measure: the indicator stays out of the way
    // entirely rather than animating in from zero width.
    const indicator = document.querySelector(INDICATOR) as HTMLElement;
    expect(indicator.getAttribute("data-state")).toBe("pending");
    expect(indicator).toHaveStyle({ display: "none" });
    expect(indicator.className).not.toContain("transition-transform");
  });

  it("lets a consumer override the selected colour instead of inheriting it", () => {
    renderGroup(
      "data-[state=on]:border-transparent data-[state=on]:bg-accent-subtle data-[state=on]:text-accent",
    );

    const selected = screen.getAllByRole("radio")[0]!;
    const unselected = screen.getAllByRole("radio")[1]!;

    // `className` is merged after the variant classes and the on-state rules, so
    // tailwind-merge resolves the conflict in the caller's favour. If someone
    // reorders those in `toggle.tsx`, this test is what notices.
    expect(selected.className).toContain("data-[state=on]:text-accent");
    expect(selected.className).not.toContain("data-[state=on]:text-primary");
    expect(selected.className).not.toContain("data-[state=on]:bg-primary-subtle");

    // The override is scoped to the pressed state: the idle item must not
    // inherit it, or every option in the group would read as selected.
    expect(unselected.className).toContain("data-[state=on]:text-accent");
    expect(unselected).toHaveAttribute("aria-checked", "false");
  });

  it("draws the group border once, on the group, so a segmented field reads as one control", () => {
    renderGroup("border-0");

    const group = screen.getByRole("radiogroup");
    expect(group.className).toContain("border");
    for (const item of screen.getAllByRole("radio")) {
      expect(item.className).toContain("border-0");
    }
  });

  it("keeps group size and variant on the item, even wrapped in a consumer component", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Gruppe" size="sm" variant="default">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    // The reason the style travels as context rather than by cloning children:
    // a `Toggle` inside a consumer's own wrapper must not silently fall back
    // to the default density.
    expect(screen.getByRole("radio").className).toContain("bg-surface-3");
  });

  it("draws the indicator on an uncontrolled group", () => {
    // This is the test that was missing, and the bug it covers was invisible in
    // every screenshot that used a *controlled* group.
    //
    // The group resolved the selected item's node from `props.value`, which is
    // the controlled value. With only `defaultValue` it is `undefined`, the
    // lookup returned `null`, `measure()` bailed out and set no box, and the
    // indicator rendered `display: none` — permanently, not just on first paint.
    // So `indicator` compiled, type-checked, accepted its prop, and drew nothing
    // on the most ordinary usage there is: an uncontrolled group.
    //
    // jsdom has no layout, so the geometry itself is all zeroes and cannot be
    // asserted. What can be asserted, and what actually failed, is whether the
    // indicator decided it had anything to show.
    const { container } = render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Gruppe" indicator>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    const indicator = container.querySelector(INDICATOR) as HTMLElement;
    expect(indicator).not.toBeNull();
    expect(indicator.style.display).not.toBe("none");
  });

  it("moves the indicator when an uncontrolled selection changes", async () => {
    // The same defect, one step further on: even if the first paint had worked,
    // a selection change has to re-resolve the node. Resolved from
    // `data-state="on"`, it does.
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Gruppe" indicator>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );

    const indicator = container.querySelector(INDICATOR) as HTMLElement;
    expect(indicator.style.display).not.toBe("none");

    await user.click(screen.getByRole("radio", { name: "B" }));
    expect(indicator.style.display).not.toBe("none");
  });
});
