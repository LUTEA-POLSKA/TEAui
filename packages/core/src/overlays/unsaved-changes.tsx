import * as React from "react";
import { COPY, UNSAVED_CHANGES } from "@tea-ui/ux-standards";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeading,
  AlertDialogOverlay,
  AlertDialogPortal,
  useConfirm,
} from "./alert-dialog";
import { Button } from "../inputs/button";

/**
 * TEA UI — the unsaved-changes guard.
 *
 * The `Crud` and `MasterDetail` pattern contracts both end with the same line —
 * *"on leaving with unsaved changes, ask — see `UNSAVED_CHANGES`"* — and nothing
 * implemented it. The standard was a paragraph plus a constant, and a paragraph
 * is what a data-loss bug walks past.
 *
 * Losing typed input to a navigation is not a cosmetic defect: the user did the
 * work, saw no error, and lost it. It is the failure mode that makes people
 * distrust the whole application.
 *
 * ### What it hooks, and what it deliberately does not
 *
 * | path | mechanism | can it be styled? |
 * |------|-----------|--------------------|
 * | a router link, or any programmatic navigation | the caller awaits `guard()` | yes |
 * | closing the tab | `beforeunload` | **no** |
 * | reloading | `beforeunload` | **no** |
 * | back / forward | `popstate`, not cancellable | no — the state is pushed back and a live region explains why |
 *
 * `beforeunload` is the one place the browser refuses to be designed: the dialog
 * is the browser's, its wording is not ours, and it is **ignored entirely unless
 * the user has interacted with the page**. That is a platform fact, not a
 * limitation of this hook — which is exactly why the in-app path carries the real
 * design work and the others are the safety net.
 *
 * ### The save-first default
 *
 * `UNSAVED_CHANGES.preferSave` is `true`, so passing `save` renders a **three**
 * button dialog with *Save* as the primary action and discarding as the one
 * furthest from the pointer. A guard that only offers "leave and lose it" pushes
 * every user down the cheapest path, and after a week of that the dialog stops
 * being read at all.
 */
export interface UnsavedChangesOptions {
  /** Whether there is anything to lose. */
  dirty: boolean;
  /** Called after a successful save. A toast here is the confirmation the trap is gone. */
  onSaved?: (() => void) | undefined;
  /** Save before leaving. When present it becomes the dialog's primary action. */
  save?: (() => Promise<void> | void) | undefined;
  /** Overrides the standard's wording, for a product with its own voice. */
  title?: string | undefined;
  detail?: string | undefined;
  discardLabel?: string | undefined;
  cancelLabel?: string | undefined;
}

export interface UnsavedChanges {
  /** Render this next to the component that owns the form. */
  confirmation: React.ReactNode;
  /**
   * Await this before navigating away. Resolves `true` when the user may leave.
   *
   * ```tsx
   * const onNavigate = async (id: string) => {
   *   if (!(await guard())) return;
   *   router.go(id);
   * };
   * ```
   */
  guard: () => Promise<boolean>;
  /** Call after a successful save, so the guard stops asking. */
  markSaved: () => void;
  /** Mark the form dirty. Call on every change that would otherwise be lost. */
  markDirty: () => void;
  /** Whether the guard would currently ask. */
  dirty: boolean;
}

export function useUnsavedChanges({
  dirty,
  onSaved,
  save,
  title = UNSAVED_CHANGES.title,
  detail = UNSAVED_CHANGES.detail,
  discardLabel = UNSAVED_CHANGES.confirmLabel,
  cancelLabel = UNSAVED_CHANGES.cancelLabel,
}: UnsavedChangesOptions): UnsavedChanges {
  const [confirmation, ask] = useConfirm();
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  /*
   * The ref is the guard's own view of "is there anything to lose", and it is
   * written three ways: by the `dirty` prop, by `markDirty` and by `markSaved`.
   * Syncing it in an effect rather than during render is deliberate — writing a
   * ref while rendering is how a component ends up with a value that disagrees
   * with what it just painted. The effect only runs when the prop actually
   * changes, so an imperative `markDirty()` is not immediately undone.
   */
  const dirtyRef = React.useRef(dirty);
  React.useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const markSaved = React.useCallback(() => {
    dirtyRef.current = false;
    setSaveOpen(false);
    onSaved?.();
  }, [onSaved]);

  /*
   * One stable listener, reading a ref. Adding and removing on every `dirty`
   * change would race the browser's own event handling, and some engines ignore a
   * listener added during the same tick as the navigation itself.
   */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      // The spec wants both. `preventDefault()` alone is ignored by Chrome;
      // `returnValue` alone is ignored by Firefox. Setting both is the only form
      // every engine honours.
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /*
   * `popstate` is not cancellable — the browser has already moved by the time it
   * fires. The only two options are to push the entry back or to warn afterwards.
   * Pushing back leaves the user where they were, which is the least surprising,
   * and the live region says why so the silence is not a mystery.
   */
  const [blockedHistory, setBlockedHistory] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      if (!dirtyRef.current) return;
      window.history.pushState(null, "", window.location.href);
      setBlockedHistory(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const guard = React.useCallback(async () => {
    if (!dirtyRef.current) return true;
    // With a `save` handler this path is unreachable — the three-button dialog
    // takes over — so the two-button form stays the fallback and the two never
    // appear together.
    if (save) {
      setSaveOpen(true);
      return false;
    }
    return ask({ level: "recoverable", what: "your changes", title, description: detail, confirmLabel: discardLabel, cancelLabel });
  }, [ask, save, title, detail, discardLabel, cancelLabel]);

  return {
    confirmation: (
      <>
        {confirmation}

        {save ? (
          <AlertDialog open={saveOpen} onOpenChange={(open) => !open && setSaveOpen(false)}>
            <AlertDialogPortal>
              <AlertDialogOverlay />
              <AlertDialogContent>
                {/*
                  `caution`, not `critical`: leaving with unsaved input is a
                  recoverable inconvenience, and a red octagon on every accidental
                  tab switch trains people to dismiss the one dialog that matters.
                */}
                <AlertDialogHeading tone="caution" title={title} description={detail} />
                <AlertDialogFooter>
                  {/*
                    Save first in the DOM, then stay, then discard. With
                    `flex-col-reverse` that puts *Save* at the bottom of a
                    phone stack and on the right on a desktop — and the discard
                    button furthest from both the pointer and the primary action.
                  */}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Discarding is not saving: the form stays dirty on purpose,
                      // so the *next* navigation asks again rather than pretending
                      // the user is clean.
                      setSaveOpen(false);
                    }}
                  >
                    {discardLabel}
                  </Button>
                  <Button variant="ghost" onClick={() => setSaveOpen(false)}>
                    {cancelLabel}
                  </Button>
                  <Button
                    variant="primary"
                    loading={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await save();
                        markSaved();
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {COPY.actions.save}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogPortal>
          </AlertDialog>
        ) : null}

        {blockedHistory ? (
          <p role="status" aria-live="polite" className="sr-only">
            {title}. {detail}
          </p>
        ) : null}
      </>
    ),
    guard,
    markSaved,
    markDirty: React.useCallback(() => {
      dirtyRef.current = true;
    }, []),
    dirty,
  };
}
