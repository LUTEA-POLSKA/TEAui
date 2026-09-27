/**
 * TEA UI — internal helpers.
 *
 * NOT part of the public API. Nothing in here is exported from
 * `@tea-ui/core`, and nothing in here is covered by semver. It exists so the
 * public surface can stay small and intentional while the implementation stays
 * consistent.
 */
export { useControllableState, type UseControllableStateParams } from "./use-controllable-state";
export { composeRefs, setRefs, splitProps, type PossibleRef } from "./refs";
export {
  dataSlot,
  renderElement,
  stateAttributes,
  withPrivateRef,
  type RenderProps,
  type SlotProps,
  type StateAttributes,
} from "./slot";
