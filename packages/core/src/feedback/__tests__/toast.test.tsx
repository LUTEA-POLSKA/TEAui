import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TOAST_LIMIT, Toaster, toast, useToast, type ToastInput } from "../toast";

/**
 * The store is module-level, so these tests have to answer the questions the
 * store cannot answer about itself: where a toast ends up in the DOM, what
 * announces it, and whether dismissing it actually stops its timer.
 */
/**
 * `afterEach` hooks run in reverse registration order, so this fires before the
 * `cleanup()` registered in the setup file — meaning the store is emptied while
 * a `Toaster` is still mounted. That update is real, so it goes inside act.
 */
afterEach(() => {
  act(() => {
    toast.clear();
  });
  vi.useRealTimers();
});

/** Counts store writes reaching React, so a stray emit is observable. */
function Probe({ onRender }: { onRender: () => void }): React.ReactElement {
  const { toasts } = useToast();
  onRender();
  return <span data-testid="count">{toasts.length}</span>;
}

/** Adding a toast is a state update, so it has to happen inside act. */
function push(input: ToastInput | ToastInput[]): void {
  act(() => {
    for (const one of Array.isArray(input) ? input : [input]) toast(one);
  });
}

describe("Toaster", () => {
  it("renders toasts inside the viewport, which is what positions and labels them", async () => {
    render(<Toaster />);

    push({ title: "Saved" });
    const item = await screen.findByText("Saved");
    const viewport = document.querySelector('[data-slot="tea-toast-viewport"]')!;

    // `ToastPrimitive.Root` registers with the provider and is rendered through
    // the viewport, so the `fixed end-0 top-0` classes on the viewport are what
    // actually place the toast. Asserting the sibling relationship in the JSX
    // would be wrong — the DOM position is decided by the primitive, not by the
    // order of the children in this file.
    expect(viewport).toContainElement(item);
  });

  it("puts the toast in a labelled region, so a screen reader can find it", async () => {
    render(<Toaster />);

    push({ title: "Account saved", description: "The change is live." });
    const item = await screen.findByText("Account saved");

    // Announcing is the primitive's job: `Root` keeps its own live region and
    // deliberately does not carry `role="status"` itself. What this surface owns
    // is the region the toast sits in, and that region has to be labelled.
    const region = item.closest('[role="region"]')!;
    expect(region).not.toBeNull();
    expect(region.getAttribute("aria-label")).toBeTruthy();
  });

  it("closes one toast without disturbing the others", async () => {
    const user = userEvent.setup();
    render(<Toaster />);

    push([{ title: "First" }, { title: "Second" }]);
    await screen.findByText("First");

    await user.click(screen.getAllByRole("button", { name: /close/i })[0]!);

    expect(await screen.findByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("dismisses all toasts from a single labelled control", async () => {
    const user = userEvent.setup();
    render(<Toaster />);

    push([{ title: "First" }, { title: "Second" }]);
    await screen.findByText("First");

    // The control used to read "Reset", which promises to put a form back the
    // way it was. Nothing here is a form, and nothing here is reset.
    await user.click(screen.getByRole("button", { name: /dismiss all/i }));

    expect(screen.queryByText("First")).toBeNull();
    expect(screen.queryByText("Second")).toBeNull();
  });

  it("stops the timer of a toast that was dismissed early", async () => {
    vi.useFakeTimers();
    const renders = vi.fn();
    const id = toast({ title: "Dismissed early", duration: 5000 });

    render(
      <>
        <Toaster />
        <Probe onRender={renders} />
      </>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      toast.dismiss(id);
    });
    expect(screen.queryByText("Dismissed early")).toBeNull();
    const afterDismiss = renders.mock.calls.length;

    // A timer left armed would fire here, rewrite the store and re-render every
    // subscriber for a toast that has been gone since the first second.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(renders.mock.calls.length).toBe(afterDismiss);
  });

  it("shows two windows on one list when two Toasters are mounted", async () => {
    // A sharp edge, not a design: the store is module-level, so a second
    // Toaster renders every toast a second time — and the primitive announces it
    // a second time too. The source says mount this once; this test is what
    // keeps that advice honest until the surface enforces it.
    render(
      <>
        <Toaster />
        <Toaster />
      </>,
    );

    push({ title: "Once" });
    await screen.findAllByText("Once");

    expect(screen.getAllByText("Once")).toHaveLength(2);
  });

  it("renders no live region of its own", async () => {
    const { container } = render(<Toaster />);

    // A hardcoded 0 fed an empty `aria-live` span: a region that claims to
    // announce and never does.
    expect(container.querySelectorAll("[data-toast-count]")).toHaveLength(0);
  });
});

describe("toast store", () => {
  it("keeps the newest TOAST_LIMIT entries", async () => {
    render(<Toaster />);

    // duration 0 keeps a toast until it is dismissed, so the limit is what is
    // under test rather than a timer.
    push(Array.from({ length: TOAST_LIMIT + 3 }, (_, i) => ({ title: `Toast ${i}`, duration: 0 })));
    await screen.findByText(`Toast ${TOAST_LIMIT + 2}`);

    expect(screen.getAllByRole("listitem")).toHaveLength(TOAST_LIMIT);
    expect(screen.queryByText("Toast 0")).toBeNull();
    expect(screen.getByText(`Toast ${TOAST_LIMIT + 2}`)).toBeInTheDocument();
  });

  it("does not throw when a toast is dismissed twice", () => {
    const id = toast({ title: "Twice" });
    expect(() => {
      toast.dismiss(id);
      toast.dismiss(id);
    }).not.toThrow();
  });
});
