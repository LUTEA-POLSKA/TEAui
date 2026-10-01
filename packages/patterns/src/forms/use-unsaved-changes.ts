import * as React from "react";
import { UNSAVED_CHANGES } from "@tea-ui/ux-standards";

/**
 * TEA UI Patterns — useUnsavedChanges.
 *
 * The guard that stops typed input being lost to a navigation.
 *
 * This is separated from `SaveBar` because the two answer different questions
 * and are needed in different places. The bar says *what is unsaved*; this asks
 * *may you leave*. A product that navigates without ever showing the bar still
 * needs this one, and a product that shows the bar on a page with nothing to
 * navigate away from still does not need it.
 *
 * **Two exits, two mechanisms, and neither of them covers the other.**
 * `window.beforeunload` handles a tab close, a reload and a link out to another
 * site. It cannot handle an in-app route change, because the document never
 * unloads. So `confirmLeave` is returned for the router to call, and a router
 * that forgets to call it is a bug the hook cannot detect — hence
 * `UNSAVED_CHANGES` naming this as a pattern rather than leaving each product to
 * remember.
 *
 * `beforeunload` cannot be tested by dispatching an event, because the browser
 * shows its own dialog and jsdom does not. What is asserted instead is the
 * listener's *presence and removal*, which is the part that is ours.
 */

export interface UnsavedChangesOptions {
  /**
   * The confirmation shown when leaving is blocked. Spread `UNSAVED_CHANGES` and
   * override the four keys to localise the whole guard in one place.
   */
  readonly messages?: typeof UNSAVED_CHANGES;
}

export interface UseUnsavedChanges {
  /**
   * For a router guard. Returns `true` when leaving is allowed, and `false` when
   * it was blocked because there are unsaved changes.
   */
  confirmLeave: () => boolean;
  /** Whether the guard is currently armed. `false` once the changes are saved. */
  readonly blocked: boolean;
}

export function useUnsavedChanges(
  /** Whether there is anything unsaved right now. */
  dirty: boolean,
  options: UnsavedChangesOptions = {},
): UseUnsavedChanges {
  const messages = options.messages ?? UNSAVED_CHANGES;

  React.useEffect(() => {
    if (!dirty) return undefined;

    const onBeforeUnload = (event: BeforeUnloadEvent): string | undefined => {
      /*
       * `returnValue` is the legacy half of this API and the only half Safari
       * honours; the string return is not what triggers the dialog. Setting both
       * is not belt and braces, it is the documented shape.
       */
      event.preventDefault();
      event.returnValue = messages.detail;
      return messages.detail;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, messages.detail]);

  const confirmLeave = React.useCallback((): boolean => {
    if (!dirty) return true;
    if (typeof window === "undefined") return false;
    return window.confirm(`${messages.title}\n\n${messages.detail}`);
  }, [dirty, messages.detail, messages.title]);

  /*
   * `blocked` is derived from `dirty` rather than stored, and an earlier version
   * of this hook mirrored `dirty` into state with an effect so it could clear
   * itself after a confirmed leave. That mirrored state was two bugs: the mirror
   * lagged the prop by a render, and clearing it locally only moved the double
   * dialog somewhere else — a router that asks again still asks again, because
   * the router, not this hook, is what performs the navigation.
   */
  return React.useMemo(() => ({ confirmLeave, blocked: dirty }), [confirmLeave, dirty]);
}