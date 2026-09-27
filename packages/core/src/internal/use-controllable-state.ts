import * as React from "react";

/**
 * Controlled/uncontrolled state in one place.
 *
 * TEA UI components are controlled, uncontrolled, or switch between the two at
 * runtime without losing state — and the switch must not fire a spurious change
 * callback, because a consumer's `onChange` writing back to state is the
 * normal pattern and a spurious call turns it into a render loop.
 *
 * The distinction that matters: an *uncontrolled-to-controlled* transition is a
 * real error and is reported. A *controlled* value that equals the internal one
 * never notifies.
 */
export interface UseControllableStateParams<T> {
  /** The controlled value. `undefined` means "the component owns it". */
  value?: T | undefined;
  /** The uncontrolled initial value. Ignored once `value` is provided. */
  defaultValue?: T | undefined;
  /** Called on every real change, in both modes. */
  onChange?: ((next: T) => void) | undefined;
  /** Name used in the controlled/uncontrolled error message. */
  name?: string | undefined;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  name = "component",
}: UseControllableStateParams<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue as T);
  const isControlled = value !== undefined;
  const current = (isControlled ? value : uncontrolled) as T;

  // `onChange` is read through a ref so a caller passing an inline arrow does
  // not invalidate the setter identity and re-render every consumer of it.
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  const wasControlled = React.useRef(isControlled);
  React.useEffect(() => {
    if (wasControlled.current !== isControlled) {
      // Not fatal, but it means the consumer's expectation and the component's
      // state have diverged — usually a missing `value` in a conditional render.
      console.warn(
        `[tea-ui] <${name}> switched from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${
          isControlled ? "controlled" : "uncontrolled"
        }. Pick one mode and keep it.`,
      );
      wasControlled.current = isControlled;
    }
  }, [isControlled, name]);

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (Object.is(resolved, current)) return;
      if (!isControlled) setUncontrolled(resolved);
      onChangeRef.current?.(resolved);
    },
    [current, isControlled],
  );

  return [current, setValue];
}
