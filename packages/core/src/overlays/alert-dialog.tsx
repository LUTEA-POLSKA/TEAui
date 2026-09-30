import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { OctagonAlert } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";
import {
  COPY,
  DESTRUCTIVE_VERBS,
  consequenceSentence,
  type ConsequenceLevel,
} from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";
import { Button } from "../inputs/button";
import { Input } from "../inputs/input";
import { Field, FieldLabel } from "../inputs/field";

/**
 * TEA UI — AlertDialog, ConfirmDialog, `useConfirm`.
 *
 * The destructive-action standard, and the fix for an inversion the audit found
 * in both source products: a *reversible* two-step inline confirmation sat
 * beside an *irreversible* `DELETE` that had no confirmation at all. Protection
 * was being spent in the wrong place.
 *
 * Two rules make this correct, and both are enforced here rather than left to
 * the caller:
 *
 *  1. **Cancel is the default focus, and the destructive button is never the
 *     primary.** The default variant of the cancel button is `secondary`, the
 *     default variant of the confirm button is `outline` for recoverable work
 *     and `destructive` only for irreversible work — and it still sits second in
 *     the DOM order. A user who presses Enter reflexively must not destroy
 *     anything.
 *  2. **The consequence is stated, not implied.** `consequenceSentence()` builds
 *     it, so a dialog that says "is being deleted" can never sit next to a button
 *     that says "Wiederherstellen".
 *
 * For `irreversible`, `confirmWord` must be typed before the action enables.
 */
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-modal bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...dataSlot("alert-dialog", "overlay")}
      {...props}
    />
  );
});

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How bad it is. Determines the protection. */
  level: ConsequenceLevel;
  /** The noun phrase, e.g. "Der Server" or "Alle Backups". */
  what: string;
  title?: string | undefined;
  /** Extra detail beyond the generated consequence sentence. */
  description?: string | undefined;
  /**
   * Required for `irreversible`. The user must type this exactly before the
   * action enables — the last check for an action with no undo.
   */
  confirmWord?: string | undefined;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  /** Run when the user confirms. May be async; the dialog waits for it. */
  onConfirm: () => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* The parts                                                                   */
/* -------------------------------------------------------------------------- */
/**
 * The alert-dialog shell, as parts.
 *
 * Extracted because a second dialog now needs the same frame — the unsaved-changes
 * guard has three actions where `ConfirmDialog` has two — and copying the class
 * strings into it would be the exact defect the audit counted forty of. The
 * frame is a decision, so it has one address.
 */
export const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(function AlertDialogContent({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed start-1/2 top-1/2 z-modal w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
        "border border-critical-border bg-surface p-4 shadow-modal",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...dataSlot("alert-dialog", "content")}
      {...props}
    />
  );
});

/** Icon, title and description as one block. `tone` picks the icon's meaning. */
export function AlertDialogHeading({
  icon,
  title,
  description,
  tone = "critical",
}: {
  icon?: React.ReactNode | undefined;
  title: string;
  description: React.ReactNode;
  tone?: "critical" | "caution" | undefined;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon ?? <OctagonAlert size={20} className={tone === "caution" ? "text-caution" : "text-critical"} />}
      </span>
      <div className="min-w-0 flex-1">
        <AlertDialogPrimitive.Title className="text-title font-semibold text-fg">
          {title}
        </AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="mt-1 text-ui text-fg-muted">
          {description}
        </AlertDialogPrimitive.Description>
      </div>
    </div>
  );
}

/**
 * The action row.
 *
 * `flex-col-reverse` is deliberate and is the reason the destructive action goes
 * **first in the DOM**: on a phone the stack is read from the bottom up, so the
 * primary action must be the last child to be the bottom-most — and the one
 * furthest from the discard button.
 */
export const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function AlertDialogFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...dataSlot("alert-dialog", "footer")}
      {...props}
    />
  );
});


export function ConfirmDialog({
  open,
  onOpenChange,
  level,
  what,
  title,
  description,
  confirmWord,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmDialogProps): React.ReactElement {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // The typed word is a gate on the destructive action, never a stored value.
  // It is cleared during render rather than in an effect, so reopening the
  // dialog never inherits a previous confirmation — and never renders one frame
  // with the old word still in the field.
  if (!open && typed !== "") setTyped("");

  const needsWord = level === "irreversible" && Boolean(confirmWord);
  const canConfirm = !needsWord || typed.trim() === confirmWord;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeading
            title={title ?? COPY.destructive.confirmTitle}
            description={
              <>
                {consequenceSentence(what, level)}
                {description ? ` ${description}` : null}
              </>
            }
          />

          {needsWord ? (
            <Field className="mt-4" id="tea-confirm-word">
              <FieldLabel>
                {COPY.destructive.typeToConfirm.replace("{name}", confirmWord ?? "")}
              </FieldLabel>
              <Input
                value={typed}
                autoComplete="off"
                onChange={(event) => setTyped(event.target.value)}
                aria-invalid={typed.length > 0 && typed.trim() !== confirmWord ? true : undefined}
              />
            </Field>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                {cancelLabel ?? DESTRUCTIVE_VERBS.cancel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={level === "irreversible" ? "destructive" : "outline"}
                loading={busy}
                disabled={!canConfirm}
                onClick={(event) => {
                  if (!canConfirm) {
                    event.preventDefault();
                    return;
                  }
                  event.preventDefault();
                  const result = onConfirm();
                  if (result && typeof (result as Promise<void>).then === "function") {
                    setBusy(true);
                    void (result as Promise<void>).finally(() => {
                      setBusy(false);
                      onOpenChange(false);
                    });
                    return;
                  }
                  onOpenChange(false);
                }}
              >
                {confirmLabel ?? DESTRUCTIVE_VERBS.confirm[level]}
              </Button>
            </AlertDialogPrimitive.Action>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */

export interface ConfirmOptions extends Omit<ConfirmDialogProps, "open" | "onOpenChange" | "onConfirm"> {
  onConfirm?: () => void | Promise<void>;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

/**
 * Promise-based confirmation.
 *
 * ```tsx
 * const [confirm, ask] = useConfirm();
 * const onDelete = async () => {
 *   const ok = await ask({ level: "irreversible", what: "The server", confirmWord: "srv-1" });
 *   if (ok) await remove();
 * };
 * return <>{confirm}<Button onClick={onDelete}>Delete</Button></>;
 * ```
 *
 * The pending promise is tracked in a ref and resolved in an effect, so an
 * unmount while a dialog is open resolves to `false` instead of leaving the
 * caller's `await` hanging forever.
 */
export function useConfirm(): [React.ReactNode, ConfirmFn] {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((result: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setOptions(null);
    resolve?.(result);
  }, []);

  React.useEffect(() => {
    return () => {
      resolver.current?.(false);
      resolver.current = null;
    };
  }, []);

  const ask = React.useCallback<ConfirmFn>((next) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);

  const node = options ? (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      {...options}
      onConfirm={async () => {
        await options.onConfirm?.();
        settle(true);
      }}
    />
  ) : null;

  return [node, ask];
}
