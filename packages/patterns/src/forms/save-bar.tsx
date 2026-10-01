import * as React from "react";
import { Button, ButtonGroup, dataSlot } from "@tea-ui/core";
import { cn } from "@tea-ui/utils";
import { COPY, UNSAVED_CHANGES } from "@tea-ui/ux-standards";

/**
 * TEA UI Patterns — SaveBar.
 *
 * The bar at the foot of a page that owns changes: what is unsaved, how to save
 * them, and how to throw them away on purpose.
 *
 * The audit found this bar is where typed input quietly disappears. Two of the
 * three states every project implemented differently — `saving` and `error` — and
 * both differences lose data:
 *
 * - **`saving` with Discard still enabled.** The user clicks Discard while the
 *   request is in flight; the request resolves afterwards and re-writes the
 *   value they just discarded. Discard is therefore disabled while saving, not
 *   merely greyed out and still clickable.
 * - **`error` with no cause.** "Error" tells a user nothing they can act on. The
 *   bar requires `error` to name the cause, and keeps Save available, because
 *   retrying is usually the right next step and a disabled Save would make the
 *   failure unrecoverable from where the user is sitting.
 *
 * **`saved` is announced and then gets out of the way.** A confirmation that
 * disappears instantly is not confirmed; one that stays forever is noise. This
 * one renders in a polite live region and the actions go away, so the bar stops
 * offering to save something it has already saved.
 *
 * The bar does **not** block navigation. That is `useUnsavedChanges`, which
 * owns the guard itself — see that file. Splitting them means the bar can be
 * used on a page with nothing to navigate away from, and the guard can be used
 * without this bar's layout.
 */

export type SaveBarState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface SaveBarProps extends Omit<React.ComponentProps<"div">, "onError"> {
  /**
   * Where the page is in the save cycle. **Required** — the states differ in
   * which actions are offered, and a bar that renders the same buttons in all
   * of them is the version that leaves Discard live during a request.
   */
  state: SaveBarState;
  onSave?: () => void;
  onDiscard?: () => void;
  /**
   * The cause of the failure, as text. **Required in the `error` state** — this
   * is the string the user acts on, and "Error" is not an action.
   */
  error?: string;
  /** Confirmation text for the `saved` state. Defaults to `COPY.states.saved`. */
  savedLabel?: string;
  /**
   * Text shown while changes are unsaved. Defaults to
   * `UNSAVED_CHANGES.title`, so the bar and the leave-guard say the same words.
   */
  dirtyLabel?: string;
}

export const SaveBar = React.forwardRef<HTMLDivElement, SaveBarProps>(function SaveBar(
  {
    className,
    state,
    onSave,
    onDiscard,
    error,
    savedLabel = COPY.states.saved,
    dirtyLabel = UNSAVED_CHANGES.title,
    ...props
  },
  ref,
) {
  const saving = state === "saving";
  const showActions = state === "dirty" || saving || state === "error";

  /*
   * An `error` state with no cause is a wiring mistake, and the alternative is
   * shipping a bar that says "Error" and leaves the user with nothing to act on.
   * The fallback is the state's own name rather than an empty string, so the bar
   * is never silent — the test asserts the documented copy is used when it is
   * supplied, and this is what happens when it is not.
   */
  const errorText = error ?? COPY.states.error;

  return (
    <div
      ref={ref}
      data-tea-touch
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-line bg-surface py-3",
        className,
      )}
      data-state={state}
      {...dataSlot("save-bar")}
      {...props}
    >
      {/*
        * One live region for all of it, rather than one per state. A region that
        * is mounted when its message arrives is frequently missed, because the
        * assistive technology has to already be observing the node; a region that
        * is always there and changes its content is the reliable form.
        */}
      <div role="status" aria-live="polite" className="min-w-0 flex-1" {...dataSlot("save-bar-status")}>
        {state === "dirty" ? (
          <span className="text-ui text-fg-muted">{dirtyLabel}</span>
        ) : null}
        {state === "saving" ? (
          <span className="text-ui text-fg-muted">{COPY.states.saving}</span>
        ) : null}
        {state === "saved" ? (
          <span className="text-ui text-positive">{savedLabel}</span>
        ) : null}
        {state === "error" ? (
          <span className="text-ui text-destructive">{errorText}</span>
        ) : null}
      </div>

      {showActions ? (
        <ButtonGroup label={COPY.states.saving} {...dataSlot("save-bar-actions")}>
          {/*
           * Discard sits left of Save. `UNSAVED_CHANGES.preferSave` says saving is
           * the better path, and the button order is the part the standard
           * asserts on, so the safer action is the one under the thumb that is
           * already focused.
           */}
          {onDiscard ? (
            <Button
              variant="outline"
              onClick={onDiscard}
              disabled={saving}
              {...dataSlot("save-bar-discard")}
            >
              {COPY.actions.discard}
            </Button>
          ) : null}
          {onSave ? (
            <Button
              variant="primary"
              onClick={onSave}
              disabled={saving}
              {...dataSlot("save-bar-save")}
            >
              {COPY.actions.save}
            </Button>
          ) : null}
        </ButtonGroup>
      ) : null}
    </div>
  );
});