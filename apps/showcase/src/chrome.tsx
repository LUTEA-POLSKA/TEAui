import * as React from "react";
import { TeaMark } from "@tea-ui/icons";
import { COPY } from "@tea-ui/ux-standards";
import { Button, Container, Heading, HStack, Link, Stack, Text } from "@tea-ui/core";

import { ThemeControls } from "./display";

/* -------------------------------------------------------------------------- */
/* Hash routing                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A routing layer of eleven lines instead of a dependency.
 *
 * The Showcase has a dozen routes and no server-side rendering, so a router
 * would be a second thing to version, audit and keep tree-shakeable — for no
 * benefit the browser does not already provide. Hash routing also means the
 * production build is a static directory that works on any host, which is what
 * "Vercel-ready" has to mean in practice.
 */
export function useHashRoute(fallback: string): string {
  const read = React.useCallback(
    () => globalThis.location?.hash.replace(/^#\/?/, "").split("?")[0] || fallback,
    [fallback],
  );
  const [route, setRoute] = React.useState(read);

  React.useEffect(() => {
    const onChange = () => setRoute(read());
    globalThis.addEventListener("hashchange", onChange);
    return () => globalThis.removeEventListener("hashchange", onChange);
  }, [read]);

  return route;
}

export function navigate(path: string): void {
  globalThis.location.hash = `#/${path}`;
}

/* -------------------------------------------------------------------------- */
/* Hash query — the URL half of a filter, a tab or a selection                 */
/* -------------------------------------------------------------------------- */

/**
 * `URL_SYNC.inUrl` says a filter, a tab, a selection and an open panel belong in
 * the URL, because the alternative is a view that cannot be shared, reloaded or
 * returned to with the Back button. A demo that keeps that state in `useState`
 * breaks the rule it is supposed to be demonstrating — and a Showcase that
 * breaks its own standard is worse than no Showcase, because the rule reads as
 * optional once the reference implementation ignores it.
 *
 * So the query half of the hash is a routing concern and it lives here, beside
 * the path half. `useHashRoute` reads `#/patterns`; this reads and writes
 * `#/patterns?filter=running&section=sso`. `chrome.tsx` owned the hash before
 * this and the convention it implies is `?key=value` on the hash — the same
 * shape as a real query string, minus the round trip through a server.
 *
 * **The demo owns the state; this owns the encoding.** A library component that
 * read the URL itself would be unusable outside a routing framework, which is
 * the same reason `FilterBar`'s own header comment gives for not owning where
 * filter state lives. The demo decides *that* the filter is in the URL;
 * `useHashQuery` only knows how to spell it.
 */
export function useHashQuery(): readonly [URLSearchParams, (next: URLSearchParams) => void] {
  const read = React.useCallback(
    () => new URLSearchParams(globalThis.location?.hash.split("?")[1] ?? ""),
    [],
  );
  const [params, setParams] = React.useState(read);

  React.useEffect(() => {
    const onChange = () => setParams(read());
    globalThis.addEventListener("hashchange", onChange);
    return () => globalThis.removeEventListener("hashchange", onChange);
  }, [read]);

  const write = React.useCallback((next: URLSearchParams) => {
    setParams(next);
    /*
     * `replaceState` rather than assigning `location.hash`, and this is the
     * whole reason the hook exists instead of a `useState`. Assigning the hash
     * pushes a history entry, so a filter the user types one character at a
     * time would leave a dozen Back-button steps through a dozen prefixes of one
     * word. A filter is not a place; it is a lens on the current place. The
     * Back button still steps between *routes*, which is what it is for.
     *
     * The path half is preserved, so a filter cannot silently navigate away
     * from the section it was applied in.
     */
    const search = next.toString();
    const path = globalThis.location?.hash.split("?")[0] ?? "";
    globalThis.history.replaceState(null, "", `${path}${search ? `?${search}` : ""}`);
  }, []);

  return [params, write] as const;
}

/* -------------------------------------------------------------------------- */
/* Chrome                                                                      */
/* -------------------------------------------------------------------------- */

export interface ShowcaseNavItem {
  id: string;
  label: string;
  description: string;
}

export const SHOWCASE_NAV: readonly ShowcaseNavItem[] = [
  { id: "home", label: "Home", description: "Why TEA UI exists" },
  { id: "gallery", label: "Gallery", description: "Every element, three columns" },
  { id: "themes", label: "Themes", description: "Three identities, one API" },
  { id: "admin", label: "Admin UI", description: "Shell, metrics, states" },
  { id: "patterns", label: "Patterns", description: "Compositions that own an interaction" },
  { id: "ux", label: "UX Standards", description: "The rules, not the theory" },
  { id: "accessibility", label: "Accessibility", description: "WCAG 2.2 AA, verifiable" },
  { id: "playground", label: "Playground", description: "States and events" },
  { id: "architecture", label: "Architecture", description: "Packages, boundaries, bundles" },
];

export function ShowcaseHeader({
  route,
  onNavigate,
}: {
  route: string;
  onNavigate: (id: string) => void;
}): React.ReactElement {
  const current = SHOWCASE_NAV.find((entry) => entry.id === route) ?? SHOWCASE_NAV[0]!;
  return (
    <header className="sticky top-0 z-header border-b border-line bg-canvas">
      <Container size="full" className="flex h-14 items-center gap-4">
        <Link
          href="#/home"
          className="flex items-center gap-2 no-underline hover:no-underline"
          aria-label="TEA UI, to the home page"
        >
          <TeaMark title="TEA UI" className="size-5" />
          <span className="text-ui font-semibold tracking-tight text-fg">TEA UI</span>
        </Link>

        <nav aria-label={COPY.navigation.main} className="hidden items-center gap-1 md:flex">
          {SHOWCASE_NAV.map((entry) => (
            <a
              key={entry.id}
              href={`#/${entry.id}`}
              aria-current={current.id === entry.id ? "page" : undefined}
              onClick={() => onNavigate(entry.id)}
              className={
                current.id === entry.id
                  ? "px-2.5 py-1.5 text-ui font-medium text-accent"
                  : "px-2.5 py-1.5 text-ui text-fg-muted transition-colors hover:text-fg"
              }
            >
              {entry.label}
            </a>
          ))}
        </nav>

        <HStack gap="ui" className="ms-auto">
          {/* The switcher, not a screenshot of one. Clicking `pop` sets one
              attribute on <html> and the entire system re-renders in a different
              palette without a single component knowing a theme exists. */}
          <ThemeControls />
          {/* `text-ui`, not `text-micro`: the switcher next to it is 14px, and a
              12px link beside a 14px control is a second, quieter thing to read
              in a row that otherwise has one type size. */}
          <a
            href="https://github.com/landnevermore/TEAui"
            className="text-ui text-fg-muted transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </HStack>
      </Container>

      {/* On small screens the nav becomes a horizontal scroller rather than a
          drawer: a Showcase is a document, and a document's navigation is a
          strip, not a panel. */}
      <nav aria-label="Sections" className="scroll-area flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {SHOWCASE_NAV.map((entry) => (
          <a
            key={entry.id}
            href={`#/${entry.id}`}
            aria-current={current.id === entry.id ? "page" : undefined}
            onClick={() => onNavigate(entry.id)}
            className={
              current.id === entry.id
                ? "whitespace-nowrap px-2.5 py-1 text-ui font-medium text-accent"
                : "whitespace-nowrap px-2.5 py-1 text-ui text-fg-muted"
            }
          >
            {entry.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function ShowcaseFooter(): React.ReactElement {
  return (
    <footer className="mt-16 border-t border-line">
      <Container size="full" className="flex flex-col gap-6 py-10 md:flex-row md:justify-between">
        <div className="max-w-md">
          <HStack gap="ui" className="mb-2">
            <TeaMark className="size-5" />
            <span className="text-ui font-semibold text-fg">TEA UI</span>
          </HStack>
          <Text size="micro" tone="muted">
            Build once. Generalize properly. Reuse everywhere.
          </Text>
        </div>
        {/*
          No `.slice()` here. The footer used to take the first four entries of
          the nav, so adding a page silently dropped the rest — the header showed
          nine routes and the footer four, and nothing reported the difference.
          The nav splits in half instead, so a seventh or eighth entry changes
          the column count rather than disappearing.
        */}
        {([0, 1] as const).map((column) => {
          const half = Math.ceil(SHOWCASE_NAV.length / 2);
          const entries = column === 0 ? SHOWCASE_NAV.slice(0, half) : SHOWCASE_NAV.slice(half);
          if (entries.length === 0) return null;
          return (
            <Stack key={column} gap="ui" className="min-w-56">
              {entries.map((entry) => (
                <a key={entry.id} href={`#/${entry.id}`} className="text-micro text-fg-muted hover:text-fg">
                  {entry.label}
                </a>
              ))}
            </Stack>
          );
        })}
        <Stack gap="ui" className="min-w-56">
          <a
            href="https://github.com/landnevermore/TEAui"
            className="text-micro text-fg-muted hover:text-fg"
          >
            Repository
          </a>
          <Text size="micro" tone="subtle">
            Private. For the TEA world only.
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Building blocks the sections share                                          */
/* -------------------------------------------------------------------------- */

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string | undefined;
  eyebrow: string;
  title: string;
  lead?: string | undefined;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section id={id} className="scroll-mt-20 border-b border-line py-10 last:border-b-0">
      <Container size="full">
        <p className="text-label font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <Heading level={2} className="mt-1.5">
          {title}
        </Heading>
        {lead ? (
          <Text size="lead" tone="muted" className="mt-2 max-w-2xl">
            {lead}
          </Text>
        ) : null}
        <div className="mt-6">{children}</div>
      </Container>
    </section>
  );
}

/** A titled block for one demo. Used so every demo has the same frame. */
export function Demo({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Heading level={3}>{title}</Heading>
        {description ? (
          <Text size="micro" tone="muted" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="border border-line bg-surface p-4">{children}</div>
    </div>
  );
}

/** Inline row of variants, wrapping. The standard arrangement for a gallery. */
export function Row({ children, label }: { children: React.ReactNode; label?: string | undefined }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <p className="text-label font-semibold uppercase tracking-widest text-fg-subtle">{label}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export { Button };
