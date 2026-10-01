import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "../stat-tile";
import { DEFAULT_SCORE_BANDS, LEAD_SCORE_BANDS, Score, scoreBand } from "../score";

describe("score bands", () => {
  it("matches the highest threshold the value reaches", () => {
    expect(scoreBand(85).label).toBe("Good");
    expect(scoreBand(70).label).toBe("Good");
    expect(scoreBand(69).label).toBe("Fair");
    expect(scoreBand(45).label).toBe("Fair");
    expect(scoreBand(44).label).toBe("Poor");
    expect(scoreBand(0).label).toBe("Poor");
  });

  it("gives a value below every threshold a verdict rather than nothing", () => {
    // A score with no band is a score with no verdict — the one outcome the
    // component exists to prevent.
    expect(scoreBand(-5).label).toBe("Poor");
    expect(scoreBand(-5).tone).toBe("critical");
  });

  /**
   * The audit found the two products differed in two ways, and only one of them
   * survives review. The threshold difference (40 vs 45) is a real domain
   * difference — a lead score and an audit score are different questions. The
   * tone difference is not: grey says "no measurement", and a score of 0 measured
   * and found wanting is not the same fact as no score at all.
   */
  it("offers the threshold difference but not the tone difference", () => {
    // The threshold difference is a real domain difference and is kept: 42 sits
    // in the middle band under 40 and in the low band under 45.
    expect(scoreBand(42, LEAD_SCORE_BANDS).label).toBe("Fair");
    expect(scoreBand(42, DEFAULT_SCORE_BANDS).label).toBe("Poor");

    // The tone difference is not. Below *both* thresholds — the zone the audit
    // found reading as a red error in the auditor and as grey "no data" on the
    // dashboard — both tables now say the same thing, and neither says neutral:
    // a score of 0 that was measured is not the same fact as no score at all.
    for (const value of [39, 20, 0]) {
      expect(scoreBand(value).tone).toBe(scoreBand(value, LEAD_SCORE_BANDS).tone);
      expect(scoreBand(value).tone).not.toBe("neutral");
    }
  });
});

describe("Score", () => {
  it("shows the number, the word and the tone — three signals, never one", () => {
    render(<Score value={72} caption="Lead-Qualität" />);

    expect(screen.getByText("72")).toBeInTheDocument();
    // The word is what survives greyscale, a screen reader and colour blindness.
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("carries the score into the accessibility tree as a sentence", () => {
    render(<Score value={72} caption="Lead-Qualität" label="Lead-Qualität" />);

    const meter = screen.getByRole("meter", { name: "Lead-Qualität" });
    // The number alone is never the answer; the number, the scale and the band are.
    expect(meter).toHaveAttribute("aria-valuetext", "72 of 100 — Good");
  });

  it("does not read the number twice when a label is given", () => {
    render(<Score value={72} caption="Lead-Qualität" label="Lead-Qualität" />);
    // The number is `aria-hidden` beside an explicit name, so a screen reader
    // gets "Lead-Qualität, 72, Good" and not "72, 72, Good".
    expect(screen.getByText("72")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders no bar for an unknown score, because a bar at zero is a claim", () => {
    render(<Score value={0} caption="Lead-Qualität" indeterminate />);

    expect(screen.getByText("No score")).toBeInTheDocument();
    // Drawing an empty bar asserts a measurement that was never taken.
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });

  it("keeps the same verdict for the same number across both tables", () => {
    const { rerender } = render(<Score value={42} caption="Reife" />);
    expect(screen.getByText("Poor")).toBeInTheDocument();

    rerender(<Score value={42} caption="Reife" bands={LEAD_SCORE_BANDS} />);
    // The threshold moved, so the word is allowed to move with it — but the low
    // score is stated as bad on both, which is the half the audit flagged.
    expect(screen.getByText("Fair")).toBeInTheDocument();
    expect(screen.queryByText("No score")).not.toBeInTheDocument();
  });
});

describe("MetricCard", () => {
  it("composes Meter instead of hand-rolling a bar", () => {
    render(<MetricCard label="Speicherplatz" value="18,4 GB" percent={74} />);

    // The hand-rolled version had role and value but no valuetext; the composed
    // one has all three, in one place.
    const meter = screen.getByRole("meter", { name: "Speicherplatz" });
    expect(meter).toHaveAttribute("aria-valuenow", "74");
  });

  it("renders no meter without a percentage", () => {
    render(<MetricCard label="Speicherplatz" value="18,4 GB" />);
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });
});
