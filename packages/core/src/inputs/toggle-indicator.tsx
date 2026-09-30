import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — the sliding indicator behind a `ToggleGroup`.
 *
 * A segmented control is one control, so its selected segment should read as a
 * position inside it, not as one button among several that happens to be
 * pressed. That is the whole job here: measure where the selected item is and
 * put a surface there, so moving the selection moves a thing.
 *
 * Three things make this harder than it looks, and all three are the reason it
 * is a component rather than a recipe in the Showcase:
 *
 *  - **The measurement has to be re-taken.** The indicator is positioned in
 *    pixels, so a font swap, a density change, a longer label or a window
 *    resize all invalidate it. A `useLayoutEffect` alone snaps the indicator to
 *    a stale position the first time the width changes, which is the version
 *    everybody builds first. A `ResizeObserver` on the group covers all of it,
 *    including a label that is still loading.
 *  - **It must not animate on the first paint.** Animating from zero width on
 *    mount plays a slide for a selection that was already made, which is motion
 *    with no cause. The indicator is placed without a transition until the
 *    measured geometry is known.
 *  - **It must be hidden from assistive technology.** The selected item already
 *    carries `aria-checked` or `aria-pressed`. A second element describing the
 *    same thing announces the selection twice, so the indicator is presentational
 *    and `aria-hidden`.
 *
 * Reduced motion needs no work here, and that is deliberate. The stylesheet
 * already collapses every `transition-duration` to `0.01ms !important` under
 * `prefers-reduced-motion: reduce`, so the indicator jumps instead of sliding —
 * the correct fallback, and one less `matchMedia` per component.
 */
interface IndicatorBox {
  left: number;
  width: number;
  top: number;
  height: number;
}

export interface ToggleIndicatorProps {
  /** The group, to measure against. */
  groupRef: React.RefObject<HTMLElement | null>;
  /** The selected item, to measure. A ref, so the prop identity stays stable. */
  itemRef: React.RefObject<HTMLElement | null>;
  className?: string | undefined;
}

export function ToggleIndicator({
  groupRef,
  itemRef,
  className,
}: ToggleIndicatorProps): React.ReactElement {
  const [box, setBox] = React.useState<IndicatorBox | null>(null);
  const boxRef = React.useRef<IndicatorBox | null>(null);

  const measure = React.useCallback(() => {
    const group = groupRef.current;
    /*
     * The selected item is found here, by asking the committed DOM, rather than
     * being handed in by the group.
     *
     * The group cannot supply it reliably. On a controlled group it can, from
     * `props.value` — but on an uncontrolled one `props.value` is `undefined` and
     * the indicator rendered `display: none` forever. The next fix read
     * `data-state="on"` from the group, which fixed the first paint and left the
     * indicator frozen: the group's own function does not re-render when the
     * selection moves, because that state lives inside Radix' primitive, below it.
     * A no-deps layout effect on the group therefore never runs again.
     *
     * The indicator sits *inside* that primitive, so it re-renders on every
     * selection change, and a child's layout effect runs after the DOM is
     * committed. This is the only place where `data-state="on"` is known to mean
     * the current selection rather than the previous one.
     */
    const item =
      (group?.querySelector<HTMLElement>(
        '[data-slot="tea-toggle-group-item"][data-state="on"]',
      ) ?? null) || itemRef.current;
    if (!group || !item) {
      setBox(null);
      return;
    }
    const groupBox = group.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    // `top` and `transform` resolve against an absolutely positioned element's
    // containing block, which is the ancestor's *padding* box — one border-width
    // inside the border box that `getBoundingClientRect` reports. `clientLeft`
    // and `clientTop` are exactly that border, so subtracting them aligns the two
    // frames. Without this the indicator sat one pixel low, which is the kind of
    // error that is invisible in a screenshot and maddening in a diff.
    const originX = groupBox.left + group.clientLeft;
    const originY = groupBox.top + group.clientTop;
    const next: IndicatorBox = {
      left: itemBox.left - originX,
      width: itemBox.width,
      // Top and height are measured for the same reason they are not left as
      // `inset-y-0`. An absolutely positioned element resolves `inset-y-0`
      // against the containing block's *padding* box, so a group with `p-1`
      // produced an indicator 8px taller than its item: 4px above and 4px
      // below, sitting 1px from the group's own border. The inner spacing the
      // group exists to provide was cancelled out by the thing meant to fill it.
      top: itemBox.top - originY,
      height: itemBox.height,
    };
    /*
     * Only publish a real change. The measure runs on every render now, so
     * `setBox` with a fresh object each time would re-render the indicator,
     * whose render runs the measure again — a loop that never settles. Comparing
     * the four numbers first is what makes running on every render safe.
     */
    const prev = boxRef.current;
    if (
      prev &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.top === next.top &&
      prev.height === next.height
    ) {
      return;
    }
    boxRef.current = next;
    setBox(next);
  }, [groupRef, itemRef]);

  /*
   * No dependency array, deliberately.
   *
   * The effect used to depend on `value` and `version` so it would re-measure
   * when the selection moved. That cannot work: on an uncontrolled group `value`
   * is permanently `undefined` and `version` only changes when an item mounts or
   * unmounts, so neither dep ever changed and the effect stopped running. The
   * pressed item followed the click and the indicator stayed where it was.
   *
   * The indicator re-renders on every selection change anyway — it lives inside
   * Radix' primitive, which is where the uncontrolled state actually lives — so
   * running on every render is what actually tracks the selection. The equality
   * check above keeps that from costing a re-render per pass.
   */
  React.useLayoutEffect(measure);

  React.useEffect(() => {
    const group = groupRef.current;
    if (!group || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [groupRef, measure]);

  return (
    <span
      aria-hidden="true"
      data-state={box ? "placed" : "pending"}
      className={cn(
        "pointer-events-none absolute bg-surface-2",
        // No transition until the geometry is known, so the first paint does
        // not animate in from nothing.
        box && "transition-transform duration-normal ease-standard",
        className,
      )}
      style={
        box
          ? {
              // Both axes are pinned to the containing block's padding box.
              // `top` alone did not help on the horizontal axis: with no `left`,
              // an absolutely positioned flex child keeps its *static* position
              // — already sitting on the first item's edge — and `translateX`
              // adds to that. So the vertical measured exact while the
              // horizontal carried a constant 4px in every theme. `left: 0` makes
              // the transform resolve from the same origin `top` does.
              left: 0,
              top: `${box.top}px`,
              height: `${box.height}px`,
              width: `${box.width}px`,
              transform: `translateX(${box.left}px)`,
            }
          : { display: "none" }
      }
      {...dataSlot("toggle", "indicator")}
    />
  );
}
