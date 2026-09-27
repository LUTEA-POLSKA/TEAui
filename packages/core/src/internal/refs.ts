import * as React from "react";

/**
 * Ref plumbing for DOM-backed components.
 *
 * Every interactive TEA UI component forwards its ref, and every TEA UI
 * component accepts an external ref. That means every component needs the same
 * three-way merge between its own ref, the forwarded ref, and any prop ref a
 * Radix primitive hands to it. Doing it once here is the only way it is done
 * consistently.
 */

export type PossibleRef<T> = React.Ref<T> | undefined;

function assignRef<T>(ref: PossibleRef<T>, value: T): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as React.RefObject<T | null>).current = value;
  }
}

/** A ref that can hold several refs at once. */
export function setRefs<T>(...refs: PossibleRef<T>[]): (value: T) => void {
  return (value: T) => {
    for (const ref of refs) assignRef(ref, value);
  };
}

/**
 * Merge a component's internal ref with a forwarded one into a single
 * callback ref. Internal first, so a component always knows its own node.
 */
export function composeRefs<T>(...refs: PossibleRef<T>[]): (value: T) => void {
  return setRefs(...refs);
}

/**
 * Split an incoming props object into "ours to handle" and "the consumer's",
 * merging anything that is not ours forward. This is how a TEA UI wrapper stays
 * transparent: unknown props are never swallowed, and every known prop is
 * consumed exactly once.
 */
export function splitProps<T extends Record<string, unknown>, K extends keyof T>(
  props: T,
  ownKeys: readonly K[],
): { own: Pick<T, K>; rest: Omit<T, K> } {
  const own = {} as Pick<T, K>;
  const rest = {} as Omit<T, K>;
  const ownSet = new Set<PropertyKey>(ownKeys as readonly PropertyKey[]);

  for (const key of Object.keys(props) as Array<Extract<keyof T, string>>) {
    if (ownSet.has(key)) {
      (own as Record<string, unknown>)[key] = props[key];
    } else {
      (rest as Record<string, unknown>)[key] = props[key];
    }
  }
  return { own, rest };
}
