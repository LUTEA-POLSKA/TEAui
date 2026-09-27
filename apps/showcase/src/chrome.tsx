import * as React from "react";
import { TeaMark } from "@tea-ui/icons";
import { COPY } from "@tea-ui/ux-standards";
import { Button, Container, Heading, HStack, Link, Stack, Text } from "@tea-ui/core";

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
    () => globalThis.location?.hash.replace(/^#\/?/, "") || fallback,
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
/* Chrome                                                                      */
/* -------------------------------------------------------------------------- */

export interface ShowcaseNavItem {
  id: string;
  label: string;
  description: string;
}

export const SHOWCASE_NAV: readonly ShowcaseNavItem[] = [
  { id: "home", label: "Start", description: "Wofür TEA UI existiert" },
  { id: "components", label: "Components", description: "Der Core-Layer, live" },
  { id: "themes", label: "Themes", description: "Drei Identitäten, eine API" },
  { id: "admin", label: "Admin UI", description: "Shell, Metriken, Zustände" },
  { id: "ux", label: "UX Standards", description: "Die Regeln, nicht die-theory" },
  { id: "accessibility", label: "Accessibility", description: "WCAG 2.2 AA, überprüfbar" },
  { id: "playground", label: "Playground", description: "Zustände und Ereignisse" },
  { id: "architecture", label: "Architektur", description: "Pakete, Grenzen, Bündel" },
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
          aria-label="TEA UI, zur Startseite"
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
          <a
            href="https://github.com/landnevermore/TEAui"
            className="text-micro text-fg-muted transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </HStack>
      </Container>

      {/* On small screens the nav becomes a horizontal scroller rather than a
          drawer: a Showcase is a document, and a document's navigation is a
          strip, not a panel. */}
      <nav aria-label="Abschnitte" className="scroll-area flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
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
        <Stack gap="ui" className="min-w-56">
          {SHOWCASE_NAV.slice(0, 4).map((entry) => (
            <a key={entry.id} href={`#/${entry.id}`} className="text-micro text-fg-muted hover:text-fg">
              {entry.label}
            </a>
          ))}
        </Stack>
        <Stack gap="ui" className="min-w-56">
          <a
            href="https://github.com/landnevermore/TEAui"
            className="text-micro text-fg-muted hover:text-fg"
          >
            Repository
          </a>
          <Text size="micro" tone="subtle">
            Privat. Nur für die TEA-Welt.
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
