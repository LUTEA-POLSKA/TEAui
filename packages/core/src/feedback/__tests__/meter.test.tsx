import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Meter } from "../meter";

/**
 * The audit's finding was that three meters in the source product had **no role
 * at all** — no `aria-valuenow`, no name, so a screen reader read them as three
 * empty divs. Every test here is about that: what the accessibility tree
 * actually contains, not what looks right.
 */
describe("Meter", () => {
  it("exposes a named, valued measurement", () => {
    render(<Meter value={87} max={100} label="Speicherplatz" valueText="18,4 GB von 25 GB belegt" />);

    const meter = screen.getByRole("meter", { name: "Speicherplatz" });
    expect(meter).toHaveAttribute("aria-valuenow", "87");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    // The raw number is rarely what the user needs; the sentence is.
    expect(meter).toHaveAttribute("aria-valuetext", "18,4 GB von 25 GB belegt");
  });

  it("is a meter, not a progressbar", () => {
    render(<Meter value={40} label="Auslastung" />);
    // WAI-ARIA 1.2: `meter` is a scalar measurement, explicitly not task
    // progress. Announcing 87 % of a disk as "87 % finished" is a different and
    // usually wrong claim. `Progress` is the component that claims completion.
    expect(screen.getByRole("meter")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("resolves the band from the top down, so the highest threshold wins", () => {
    const bands = [
      { at: 0, tone: "critical" as const },
      { at: 45, tone: "caution" as const },
      { at: 70, tone: "positive" as const },
    ];

    const { rerender } = render(<Meter value={80} label="Score" thresholds={bands} tone="positive" />);
    expect(screen.getByRole("meter")).toBeInTheDocument();

    // The array order is deliberately the *un*sorted one, to prove the sort is
    // real and not a coincidence of the fixture.
    rerender(<Meter value={50} label="Score" thresholds={bands} />);
    const fill = document.querySelector('[data-slot="tea-meter-fill"]');
    expect(fill).toHaveClass("bg-caution");
  });

  it("clamps the drawn bar but not the announced value of an over-max reading", () => {
    render(<Meter value={140} max={100} label="Kontingent" valueText="140 von 100 — überbucht" />);

    const meter = screen.getByRole("meter", { name: "Kontingent" });
    // An AT that clamped differently would announce a figure the bar never showed.
    expect(meter).toHaveAttribute("aria-valuenow", "100");

    const fill = document.querySelector('[data-slot="tea-meter-fill"]') as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("draws the threshold marks only when asked", () => {
    const bands = [
      { at: 45, tone: "caution" as const },
      { at: 70, tone: "positive" as const },
    ];

    const { rerender } = render(<Meter value={50} label="Score" thresholds={bands} />);
    expect(document.querySelectorAll('[data-slot="tea-meter-threshold"]')).toHaveLength(0);

    rerender(<Meter value={50} label="Score" thresholds={bands} showThresholds />);
    // A band the user cannot see the edge of is a band they cannot reason about
    // before they reach it.
    expect(document.querySelectorAll('[data-slot="tea-meter-threshold"]')).toHaveLength(2);
  });

  it("is a pill, which is one of the five documented radius exceptions", () => {
    const { container } = render(<Meter value={1} label="Test" />);
    expect(container.querySelector('[data-slot="tea-meter-track"]')).toHaveClass("rounded-pill");
  });

  it("forwards its ref", () => {
    const { container } = render(<Meter value={1} label="Test" />);
    expect(container.querySelector('[data-slot="tea-meter-root"]')).toBeInstanceOf(HTMLDivElement);
  });
});
