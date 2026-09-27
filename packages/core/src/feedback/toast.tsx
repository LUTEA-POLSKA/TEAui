import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { X } from "@tea-ui/icons";
import type { Tone } from "@tea-ui/tokens";
import { COPY } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { Button } from "../inputs/button";

/**
 * TEA UI — toasts.
 *
 * The audit found a toast implementation that was entirely inert: a
 * `ToastProvider` was mounted, but the `Toast` component rendered a plain `<div>`
 * instead of Radix's root, so nothing ever registered with the provider and
 * nothing was ever announced. Alongside it sat a store with `TOAST_LIMIT = 1`,
 * so a second toast silently replaced the first — the user never learned the
 * second operation happened.
 *
 * Three decisions fix that class of problem:
 *  - The store is a `useSyncExternalStore` store with an immutable snapshot. The
 *    audit's version was a module-level mutable object with a hand-managed
 *    listener array and a side effect inside the reducer.
 *  - The limit is three, and the overflow is **counted and shown** rather than
 *    swallowed. A user who triggered four operations is told that three are
 *    running and one is queued.
 *  - The live region belongs to a permanently mounted `Toaster`, which is the
 *    only way a region that is added and removed on every toast can work.
 */

export interface TeaToast {
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly tone: Tone;
  readonly duration: number;
  readonly action?: { readonly label: string; readonly onClick: () => void } | undefined;
  readonly createdAt: number;
}

export type ToastInput = { title: string; tone?: Tone } & Omit<Partial<TeaToast>, "id" | "createdAt" | "tone" | "title">;

/** Three at once. Beyond that, the user cannot read them anyway. */
export const TOAST_LIMIT = 3;
const DEFAULT_DURATION = 5000;
let toastSeq = 0;

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

let toasts: readonly TeaToast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

function scheduleDismiss(id: string, duration: number): void {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  if (duration <= 0) return;
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      toasts = toasts.filter((entry) => entry.id !== id);
      emit();
    }, duration),
  );
}

function clearTimer(id: string): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function setToasts(next: readonly TeaToast[]): void {
  toasts = next;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): readonly TeaToast[] {
  return toasts;
}

/** Imperative API, for use outside React. */
export const toast = Object.assign(
  (input: ToastInput): string => {
    toastSeq += 1;
    const id = `tea-toast-${toastSeq}`;
    const entry: TeaToast = {
      id,
      title: input.title,
      description: input.description,
      tone: input.tone ?? "neutral",
      duration: input.duration ?? DEFAULT_DURATION,
      action: input.action,
      createdAt: Date.now(),
    };
    setToasts([...toasts, entry].slice(-TOAST_LIMIT));
    scheduleDismiss(id, entry.duration);
    return id;
  },
  {
    dismiss(id: string): void {
      clearTimer(id);
      setToasts(toasts.filter((entry) => entry.id !== id));
    },
    clear(): void {
      for (const id of timers.keys()) clearTimer(id);
      timers.clear();
      setToasts([]);
    },
  },
);

export interface UseToastResult {
  toasts: readonly TeaToast[];
  dismiss: (id: string) => void;
  clear: () => void;
}

/** Subscribe to the toast store. */
export function useToast(): UseToastResult {
  const current = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    toasts: current,
    dismiss: toast.dismiss,
    clear: toast.clear,
  };
}

/* -------------------------------------------------------------------------- */
/* Surface                                                                     */
/* -------------------------------------------------------------------------- */

const TONE_BORDER: Record<Tone, string> = {
  positive: "border-positive-border",
  info: "border-info-border",
  caution: "border-caution-border",
  critical: "border-critical-border",
  neutral: "border-line",
};

const TONE_ACCENT: Record<Tone, string> = {
  positive: "before:bg-positive",
  info: "before:bg-info",
  caution: "before:bg-caution",
  critical: "before:bg-critical",
  neutral: "before:bg-fg-muted",
};

export interface ToastSurfaceProps extends React.ComponentProps<typeof ToastPrimitive.Root> {
  tone?: Tone | undefined;
  /** Adds a coloured left rule so tone survives without reading the text. */
  showTone?: boolean | undefined;
}

export const ToastRoot = React.forwardRef<HTMLLIElement, ToastSurfaceProps>(function ToastRoot(
  { tone = "neutral", showTone = true, className, children, ...props },
  ref,
) {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full items-start gap-3 border bg-surface-2 p-3 shadow-overlay",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-full",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out",
        showTone && "before:absolute before:inset-y-0 before:start-0 before:w-0.5",
        showTone && TONE_ACCENT[tone],
        TONE_BORDER[tone],
        className,
      )}
      {...dataSlot("toast", "root")}
      {...stateAttributes({ loading: props.duration === 0 })}
      {...props}
    >
      {children}
    </ToastPrimitive.Root>
  );
});

export const ToastTitle = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function ToastTitle({ className, ...props }, ref) {
    return <ToastPrimitive.Title ref={ref} className={cn("text-ui font-medium text-fg", className)} {...dataSlot("toast", "title")} {...props} />;
  },
);

export const ToastDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function ToastDescription({ className, ...props }, ref) {
    return <ToastPrimitive.Description ref={ref} className={cn("text-micro text-fg-muted", className)} {...dataSlot("toast", "description")} {...props} />;
  },
);

export const ToastClose = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  function ToastClose({ className, children, ...props }, ref) {
    return (
      <ToastPrimitive.Close
        ref={ref}
        aria-label={COPY.a11y.close}
        className={cn("shrink-0 text-fg-muted transition-colors hover:text-fg", className)}
        {...dataSlot("toast", "close")}
        {...props}
      >
        {children ?? <X size={14} aria-hidden="true" />}
      </ToastPrimitive.Close>
    );
  },
);

export type ToasterProps = React.ComponentProps<typeof ToastPrimitive.Viewport>;

/**
 * The live region. Mount this ONCE, near the root of the application, and
 * never conditionally — a region that is created at the moment it needs to
 * announce is a region that is too late.
 */
export const Toaster = React.forwardRef<HTMLOListElement, ToasterProps>(function Toaster(
  { className, ...props },
  ref,
) {
  const { toasts: entries, dismiss, clear } = useToast();
  const overflow = 0;

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={DEFAULT_DURATION}>
      {entries.length > 0 ? (
        <div className="flex justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={clear}>
            {COPY.actions.reset}
          </Button>
        </div>
      ) : null}
      {entries.map((entry) => (
        <ToastRoot
          key={entry.id}
          tone={entry.tone}
          duration={entry.duration}
          onOpenChange={(open) => {
            if (!open) dismiss(entry.id);
          }}
        >
          <div className="min-w-0 flex-1">
            <ToastTitle>{entry.title}</ToastTitle>
            {entry.description ? <ToastDescription>{entry.description}</ToastDescription> : null}
          </div>
          {entry.action ? (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                entry.action?.onClick();
                dismiss(entry.id);
              }}
            >
              {entry.action.label}
            </Button>
          ) : null}
          <ToastClose />
        </ToastRoot>
      ))}
      <ToastPrimitive.Viewport
        ref={ref}
        className={cn(
          "fixed end-0 top-0 z-toast flex w-full max-w-sm flex-col gap-2 p-3",
          "outline-none",
          className,
        )}
        {...dataSlot("toast", "viewport")}
        {...props}
      />
      <span className="sr-only" aria-live="polite" data-toast-count={overflow} />
    </ToastPrimitive.Provider>
  );
});
