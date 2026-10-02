import { describe, expect, it } from "vitest";

import { STATUS, resourceStatusMeta, statusMeta, statusKeysWithTone } from "../index";

/**
 * The status registry, and the three-axis rule that composes it.
 *
 * A registry's real test is not that its entries exist — it is that a *missing* wire
 * value is a type error, and that the composition rule cannot be re-derived wrongly
 * by a consumer. The second one is the subject of this file.
 */
describe("status registry", () => {
  it("resolves a wire value to a label, a tone and a description", () => {
    const meta = statusMeta("health", "online");
    expect(meta.label).toBe("Online");
    expect(meta.tone).toBe("positive");
    expect(meta.description.length).toBeGreaterThan(0);
  });

  it("gives every entry a description, so no call site has to invent one", () => {
    for (const [domain, entries] of Object.entries(STATUS)) {
      for (const [key, meta] of Object.entries(entries)) {
        expect(meta.description, `${domain}.${key} has no description`).toBeTruthy();
        expect(meta.label, `${domain}.${key} has no label`).toBeTruthy();
      }
    }
  });

  it("separates the three resource axes, and does not let them collide", () => {
    expect(Object.keys(STATUS.lifecycle)).toEqual([
      "none",
      "provisioning",
      "starting",
      "stopping",
      "updating",
    ]);
    expect(Object.keys(STATUS.availability)).toEqual(["active", "suspended"]);

    // A resource in flight is not reachable, so the two axes must not be able to
    // say the same thing about it at the same time.
    expect(STATUS.lifecycle.starting.tone).not.toBe(STATUS.health.online.tone);
  });

  it("lists a tone's keys in registry order, so a filter row cannot invent one", () => {
    expect(statusKeysWithTone("lifecycle", "info")).toEqual([
      "provisioning",
      "starting",
      "updating",
    ]);
    expect(statusKeysWithTone("availability", "caution")).toEqual(["suspended"]);
  });
});

describe("resourceStatusMeta", () => {
  it("shows health when nothing is in flight", () => {
    const shown = resourceStatusMeta({
      health: "degraded",
      lifecycle: "none",
      availability: "active",
    });

    expect(shown.primary.label).toBe("Degraded");
    expect(shown.suppressed).toBeNull();
    expect(shown.availability).toBeNull();
  });

  it("shows the operation instead of health, because a starting server is not online", () => {
    // The failure this exists to prevent: reporting success before the backend has
    // confirmed it. A consumer that rendered `health` here would show "Online" for a
    // server that is not up yet.
    const shown = resourceStatusMeta({
      health: "offline",
      lifecycle: "starting",
      availability: "active",
    });

    expect(shown.primary.label).toBe("Starting");
    // The health state is kept, not dropped: a detail row or tooltip can still offer
    // it. Silently discarding it is the same loss as flattening the axes.
    expect(shown.suppressed?.label).toBe("Offline");
  });

  it("never shows 'Online' while provisioning", () => {
    for (const lifecycle of ["provisioning", "starting", "stopping", "updating"] as const) {
      const shown = resourceStatusMeta({
        health: "online",
        lifecycle,
        availability: "active",
      });
      expect(shown.primary.label).not.toBe("Online");
      expect(shown.primary).toBe(statusMeta("lifecycle", lifecycle));
    }
  });

  it("shows suspension in addition to an operation, never instead of it", () => {
    // A suspended server may well be running. Collapsing suspension into the health
    // axis loses the reason, and a customer told "offline" about a running server
    // files the wrong support request.
    const shown = resourceStatusMeta({
      health: "online",
      lifecycle: "none",
      availability: "suspended",
    });

    expect(shown.primary.label).toBe("Online");
    expect(shown.availability?.label).toBe("Suspended");
    // A hold is not a failure: it reads as caution, and never as critical.
    expect(shown.availability?.tone).toBe("caution");
  });

  it("reports both at once when a held server is also starting", () => {
    const shown = resourceStatusMeta({
      health: "offline",
      lifecycle: "starting",
      availability: "suspended",
    });

    expect(shown.primary.label).toBe("Starting");
    expect(shown.suppressed?.label).toBe("Offline");
    expect(shown.availability?.label).toBe("Suspended");
  });

  it("returns null rather than a badge for the absence of something", () => {
    // `lifecycle: "none"` and `availability: "active"` are not states to render. A
    // caller that forgot to check would otherwise put "Idle" or "Available" on
    // every row of a table.
    const shown = resourceStatusMeta({
      health: "online",
      lifecycle: "none",
      availability: "active",
    });

    expect(shown.availability).toBeNull();
    expect(shown.primary.label).not.toBe("Idle");
    expect(shown.primary.label).not.toBe("Available");
  });
});
