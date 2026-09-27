import * as React from "react";
import {
  CircleAlert,
  CloudOff,
  Lock,
  RefreshCw,
  SearchX,
  ServerCrash,
  Wrench,
} from "@tea-ui/icons";
import { EMPTY_STATE_TITLES, ERROR_TITLES, type ErrorAnatomy, type ErrorRecovery } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import { Button, Skeleton, stateAttributes } from "@tea-ui/core";

/**
 * TEA UI Admin — product states.
 *
 * The audit found, in one product alone, eight hand-written "Lade …" loaders
 * (five of them byte-identical), ten empty states, nine error banners and four
 * visual dialects of each, plus a `Skeleton` component that was fully built and
 * completely unused. This module is the answer: one implementation per state,
 * and each one answers the questions its state actually raises.
 *
 * Every state here follows the standard's rule — **every meaningful empty state
 * answers what is empty, why, and what to do next** — and every error follows
 * the error anatomy: what happened, why, what to do, whether it recovers.
 */

/* -------------------------------------------------------------------------- */
/* Empty                                                                       */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps extends React.ComponentProps<"div"> {
  /** What is empty, named specifically. "Keine Server", not "Keine Einträge". */
  title: string;
  /** Why it is empty, when the reason is not obvious. */
  description?: string | undefined;
  /** The primary next action, when there is one. */
  action?: React.ReactNode | undefined;
  /** A secondary escape hatch, e.g. clearing a filter. */
  secondaryAction?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
  className?: string | undefined;
}

/**
 * A dashed border is used deliberately: it reads as "placeholder", which is
 * what an empty region is. A solid card would imply content is merely late.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, action, secondaryAction, icon, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-3 border border-dashed border-line p-8 text-center",
        className,
      )}
      data-tea-state="empty"
      data-empty="true"
      {...stateAttributes({ empty: true })}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="text-fg-subtle">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-ui font-medium text-fg">{title}</p>
        {description ? <p className="mt-1 text-micro text-fg-muted">{description}</p> : null}
      </div>
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
});

/** "Nothing has been created yet" — distinct from "your filter matched nothing". */
export const EmptyStateNew = React.forwardRef<HTMLDivElement, Omit<EmptyStateProps, "title"> & { noun: string }>(
  function EmptyStateNew({ noun, ...props }, ref) {
    return <EmptyState ref={ref} title={`Noch keine ${noun}`} {...props} />;
  },
);

/** "Your filter excluded everything" — the reason is the filter, so say so. */
export const EmptyStateFiltered = React.forwardRef<
  HTMLDivElement,
  Omit<EmptyStateProps, "title" | "description"> & { noun: string }
>(function EmptyStateFiltered({ noun, ...props }, ref) {
  return (
    <EmptyState
      ref={ref}
      title={EMPTY_STATE_TITLES.filtered}
      description={`Keine ${noun} passen zu den aktuellen Filtern.`}
      icon={<SearchX size={20} aria-hidden="true" />}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

export interface LoadingStateProps extends React.ComponentProps<"div"> {
  /** What is loading, for the announcement. */
  label: string;
  /**
   * Skeleton count. A skeleton that mirrors the real layout beats a spinner
   * because it reserves the space, so nothing reflows when the data lands.
   */
  rows?: number | undefined;
  className?: string | undefined;
}

export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(function LoadingState(
  { label, rows = 3, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col gap-2", className)}
      data-tea-state="loading"
      {...props}
    >
      {Array.from({ length: Math.max(1, rows) }, (_, index) => (
        <Skeleton key={index} className={cn("h-9 w-full", index === rows - 1 && "w-2/3")} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
});

/**
 * A *refreshing* indicator: content stays. The audit's clearest performance
 * defect was replacing the whole region with a centred spinner on every poll, so
 * a five-second auto-refresh flashed the UI away from content the user was
 * reading.
 */
export const RefreshingIndicator = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & { label?: string | undefined }
>(function RefreshingIndicator({ label = "Wird aktualisiert", className, ...props }, ref) {
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-1.5 text-micro text-fg-muted", className)}
      data-tea-state="refreshing"
      {...props}
    >
      <RefreshCw size={12} aria-hidden="true" className="animate-spin" data-tea-motion="decorative" />
      {label}
    </span>
  );
});

/* -------------------------------------------------------------------------- */
/* Error                                                                       */
/* -------------------------------------------------------------------------- */

export interface ErrorStateProps extends React.ComponentProps<"div"> {
  /** A structured error. The component builds the message from it. */
  error: ErrorAnatomy;
  /** Retry callback. Only rendered when a retry is a plausible action. */
  onRetry?: (() => void) | undefined;
  /** Label for the retry action. */
  retryLabel?: string | undefined;
  className?: string | undefined;
}

const RETRY_LABEL: Record<ErrorRecovery, string> = {
  automatic: "Erneut versuchen",
  action: "Erneut versuchen",
  choice: "Auswählen",
  none: "Zurück",
};

/**
 * An error, rendered as an answer rather than a string.
 *
 * The visible text is always "what happened, and why". The recovery action is
 * only offered when a retry would plausibly succeed — offering it for a
 * validation error is how people learn that buttons do nothing. The technical
 * detail is behind a disclosure, because it is for the person filing the
 * report, not for the person who hit the problem.
 */
export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  { error, onRetry, retryLabel, className, ...props },
  ref,
) {
  const showRetry = Boolean(onRetry) && (error.recovery === "action" || error.recovery === "automatic");
  return (
    <div
      ref={ref}
      role="alert"
      className={cn("flex flex-col items-center gap-3 border border-critical-border bg-critical-subtle p-6 text-center", className)}
      data-tea-state="error"
      {...stateAttributes({ invalid: true })}
      {...props}
    >
      <CircleAlert size={20} aria-hidden="true" className="text-critical" />
      <div>
        <p className="text-ui font-medium text-fg">{error.title}</p>
        <p className="mt-1 text-micro text-fg-muted">{error.detail}</p>
        {error.action ? <p className="mt-2 text-micro text-fg">{error.action}</p> : null}
      </div>
      {showRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel ?? RETRY_LABEL[error.recovery]}
        </Button>
      ) : null}
      {error.technical ? (
        <details className="w-full text-start">
          <summary className="cursor-pointer text-micro text-fg-muted">Technische Details</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap border border-line bg-surface-2 p-2 text-left font-mono text-micro text-fg-muted">
            {error.technical}
          </pre>
        </details>
      ) : null}
      {error.reference ? (
        <p className="font-mono text-micro text-fg-subtle">Referenz: {error.reference}</p>
      ) : null}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* The specific states                                                         */
/* -------------------------------------------------------------------------- */

export interface StateMessageProps extends React.ComponentProps<"div"> {
  title?: string | undefined;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
}

function StateMessage({
  title,
  description,
  action,
  icon,
  className,
  tone = "neutral",
  ...props
}: StateMessageProps & { tone?: string }): React.ReactElement {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 border p-8 text-center",
        tone === "caution" ? "border-caution-border bg-caution-subtle" : "border-line",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className={tone === "caution" ? "text-caution" : "text-fg-subtle"}>
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-ui font-medium text-fg">{title}</p>
        {description ? <p className="mt-1 text-micro text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export const OfflineState = React.forwardRef<HTMLDivElement, StateMessageProps>(function OfflineState(
  { title = "Offline", description = "Es gibt keine Verbindung zum Server. Änderungen werden nicht gespeichert.", ...props },
  ref,
) {
  return <StateMessage ref={ref} tone="caution" title={title} description={description} icon={<CloudOff size={20} aria-hidden="true" />} data-tea-state="offline" {...props} />;
});

export const MaintenanceState = React.forwardRef<HTMLDivElement, StateMessageProps>(function MaintenanceState(
  { title = "Wartungsmodus", description = "Die Anwendung wird gerade gewartet und ist möglicherweise nicht verfügbar.", ...props },
  ref,
) {
  return <StateMessage ref={ref} title={title} description={description} icon={<Wrench size={20} aria-hidden="true" />} data-tea-state="maintenance" {...props} />;
});

export const PermissionDeniedState = React.forwardRef<HTMLDivElement, StateMessageProps>(
  function PermissionDeniedState(
    {
      title = ERROR_TITLES.forbidden,
      description = "Für diesen Bereich fehlt dir die nötige Berechtigung. Bitte wende dich an eine Administration.",
      ...props
    },
    ref,
  ) {
    return <StateMessage ref={ref} tone="caution" title={title} description={description} icon={<Lock size={20} aria-hidden="true" />} data-tea-state="forbidden" {...props} />;
  },
);

export const NotFoundState = React.forwardRef<HTMLDivElement, StateMessageProps>(function NotFoundState(
  { title = ERROR_TITLES.notFound, description = "Diese Seite oder dieser Eintrag existiert nicht.", ...props },
  ref,
) {
  return <StateMessage ref={ref} title={title} description={description} icon={<SearchX size={20} aria-hidden="true" />} data-tea-state="notFound" {...props} />;
});

export const ServerErrorState = React.forwardRef<HTMLDivElement, StateMessageProps>(function ServerErrorState(
  { title = ERROR_TITLES.server, description = "Der Server konnte die Anfrage nicht verarbeiten.", ...props },
  ref,
) {
  return <StateMessage ref={ref} tone="caution" title={title} description={description} icon={<ServerCrash size={20} aria-hidden="true" />} data-tea-state="error" {...props} />;
});

/* -------------------------------------------------------------------------- */
