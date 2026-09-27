import { Slot } from "radix-ui";
import * as React from "react";
import { cn, slot as slotName } from "@tea-ui/utils";

import { composeRefs } from "./refs";

/**
 * The `asChild` contract.
 *
 * Native semantics first is a TEA UI rule, and this is the mechanism that makes
 * it practical: a consumer can render a real `<a>` with the styles of a
 * `<button>`, or a real `<summary>` with the styles of a `<div>`, without the
 * library pretending to be the other element. The audit's `<a>` styled by hand
 * as a primary button, and its `<button>` wrapping an icon, both disappear into
 * `<Button asChild>`.
 */

export interface SlotProps {
  /** Render the consumer's single child element instead of a `button`/`div`. */
  asChild?: boolean | undefined;
  /** The element this component renders when `asChild` is not used. */
  as?: React.ElementType | undefined;
}

export interface RenderProps {
  asChild?: boolean | undefined;
  as?: React.ElementType | undefined;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  className?: string | undefined;
}

/**
 * Render either the default element or the consumer's child, forwarding the ref
 * and merging the class names into whichever element actually lands in the DOM.
 */
export function renderElement(
  { asChild, as, className, children, ref, ...rest }: RenderProps & Record<string, unknown>,
  defaultTag: React.ElementType,
): React.ReactElement {
  const Component = (asChild ? Slot.Root : (as ?? defaultTag)) as React.ElementType;

  if (asChild) {
    return (
      <Component className={className} ref={ref} {...rest}>
        {children}
      </Component>
    );
  }

  return (
    <Component className={className} ref={ref} {...rest}>
      {children}
    </Component>
  );
}

/**
 * The `data-slot` value a component stamps on its root. Present so that a
 * consumer can target TEA UI internals from CSS or a test without depending on
 * class names, which are an implementation detail.
 */
export function dataSlot(...parts: string[]): Record<`data-slot`, string> {
  return { "data-slot": slotName(...parts) };
}

/**
 * Every interactive TEA UI component exposes its state as data attributes, so
 * state is inspectable from the DOM and assertable in a test — not only visible.
 *
 * This is the attribute vocabulary, in one object, so no component invents its
 * own spelling.
 */
export interface StateAttributes {
  "data-disabled"?: true;
  "data-loading"?: true;
  "data-invalid"?: true;
  "data-readonly"?: true;
  "data-selected"?: true;
  "data-active"?: true;
  "data-checked"?: true;
  "data-open"?: true;
  "data-empty"?: true;
  "data-orientation"?: "horizontal" | "vertical";
}

export function stateAttributes(state: {
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  invalid?: boolean | undefined;
  readOnly?: boolean | undefined;
  selected?: boolean | undefined;
  active?: boolean | undefined;
  checked?: boolean | undefined;
  open?: boolean | undefined;
  empty?: boolean | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
}): StateAttributes {
  const attrs: StateAttributes = {};
  if (state.disabled) attrs["data-disabled"] = true;
  if (state.loading) attrs["data-loading"] = true;
  if (state.invalid) attrs["data-invalid"] = true;
  if (state.readOnly) attrs["data-readonly"] = true;
  if (state.selected) attrs["data-selected"] = true;
  if (state.active) attrs["data-active"] = true;
  if (state.checked) attrs["data-checked"] = true;
  if (state.open) attrs["data-open"] = true;
  if (state.empty) attrs["data-empty"] = true;
  if (state.orientation) attrs["data-orientation"] = state.orientation;
  return attrs;
}

/**
 * Merge refs from a forwarded ref, a prop-supplied ref and a private one.
 * `privateRef` may be a function that receives the node as well as a ref object,
 * which is how a component observes its own element without a state update.
 */
export function withPrivateRef<T>(
  forwarded: React.Ref<T> | undefined,
  propRef: React.Ref<T> | undefined,
  privateRef?: React.Ref<T>,
): React.RefCallback<T> {
  return composeRefs(forwarded, propRef, privateRef);
}

export { cn };
